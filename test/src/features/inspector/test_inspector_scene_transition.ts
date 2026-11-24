import type {
  IAutoMovieInspectionDiagnostics,
  IAutoMovieMark,
} from "@automovie/interface";
import type { IAutoMovieDrawScene } from "@automovie/render";
import {
  AutoMovieInspectorPlayhead,
  type IAutoMovieInspectorScene,
  type IAutoMovieInspectorSceneHost,
  mountAutoMovieInspectorScene,
  readAutoMovieInspectorAddress,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import type * as THREE from "three";

import { createRecordedFilmSubject } from "../draw/createRecordedFilmSubject";
import { filmResponseRendererFields } from "../internal/filmResponseRendererFields";
import { nclose } from "../internal/nclose";

/**
 * The Viewer places last the shot a painted picture shows most of, so its
 * diagnostics and marks follow that shot, as the draw page's records do.
 *
 * Scenarios, on shot A from 0 to 2 s on its clock 1 + t and shot B from 1 s
 * through a one-second cross dissolve, with a subject that observes its placed
 * samples:
 *
 * 1. Painting 1.25 s, the dissolve's first half, places the outgoing A by
 *    `seekShot` at its own clock and then observes the sample, which offers no
 *    synchronous `place`, and reads the marks, with no `seek` after it.
 * 2. Painting 1.75 s, its second half, places the live B by `seek`, and the sample
 *    offers `place`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public mount over a recording subject and frame host and asserts the order of placements, observations and mark readings; a Viewer that seeks the live second last, observes before the shown placement or offers `place` for a shot placement fails.
 * @evidence contracts/development/testing.md#independent-expectations The shown layer follows from the dissolve's weights by hand: A at 0.75 at 1.25 s and B at 0.75 at 1.75 s; A's clock is 1 + t, its trim starting at its 1 s mark.
 * @evidence contracts/development/testing.md#distinguishing-cases Both halves of the dissolve; the compositing itself belongs to `test_inspector_transition_layers` and the pixels to the SwiftShader capture.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory unit discovered as `test_inspector_scene_transition`; no browser, timer or graphics context runs.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 2 numbered scenarios it runs, each naming the second and the order it pins.
 */
export async function test_inspector_scene_transition(): Promise<void> {
  const recorded: createRecordedFilmSubject.IDouble = createRecordedFilmSubject(
    {
      transition: { kind: "crossDissolve", duration: 1 },
      seekShot: true,
      optics: false,
    },
  );
  const calls: createRecordedFilmSubject.ICall[] = recorded.calls;
  const subject: IAutoMovieDrawScene = {
    ...recorded.subject,
    place: (seconds: number): void => {
      calls.push({ name: "place", shot: null, numbers: [seconds] });
    },
    inspectPlaced: (
      sample: IAutoMovieDrawScene.IPlacedSample,
    ): IAutoMovieInspectionDiagnostics => {
      calls.push({
        name: "inspect",
        shot: null,
        numbers: [sample.time.filmSeconds, sample.place === undefined ? 0 : 1],
      });
      return {
        scope: "film",
        time: sample.time,
        findings: [],
        coverage: [],
      };
    },
    marks: (seconds: number): readonly IAutoMovieMark[] => {
      calls.push({ name: "marks", shot: null, numbers: [seconds] });
      return [];
    },
  };
  let frame: ((nowMs: number) => void) | undefined;
  const host: IAutoMovieInspectorSceneHost = {
    size: (): IAutoMovieInspectorSceneHost.ISize => ({
      width: 320,
      height: 180,
      pixelRatio: 1,
    }),
    requestFrame: (callback: (nowMs: number) => void): number => {
      frame = callback;
      return 1;
    },
    cancelFrame: (): void => {
      frame = undefined;
    },
    createRenderer: (): IAutoMovieInspectorSceneHost.ICreated => ({
      compositor: null,
      renderer: {
        ...filmResponseRendererFields(),
        localClippingEnabled: false,
        setPixelRatio: (): void => {},
        setSize: (): void => {},
        dispose: (): void => {},
        render: (_object: THREE.Object3D, _camera: THREE.Camera): void => {},
      },
    }),
  };
  const errors: string[] = [];
  const playhead: AutoMovieInspectorPlayhead = new AutoMovieInspectorPlayhead();
  const mounted: IAutoMovieInspectorScene = mountAutoMovieInspectorScene({
    subject: { create: async (): Promise<IAutoMovieDrawScene> => subject },
    name: "film",
    request: readAutoMovieInspectorAddress("at=1.25"),
    playhead,
    host,
    report: {
      ready: (): void => {},
      legend: (): void => {},
      labels: (): void => {},
      error: (message: string | null): void => {
        if (message !== null) errors.push(message);
      },
      refused: (): void => {},
    },
  });

  // 1. The dissolve's first half.
  await settle();
  calls.length = 0;
  frame!(0);
  await settle();
  const first: createRecordedFilmSubject.ICall[] = calls.splice(0);
  TestValidator.predicate(
    "the outgoing shot is placed last and observed without place",
    errors.length === 0 &&
      same(first, [
        step("seekShot", "shot:a", 2.25, 1.25),
        step("inspect", null, 1.25, 0),
        step("marks", null, 1.25),
      ]),
  );

  // 2. The dissolve's second half.
  playhead.seek(1.75);
  frame!(16);
  await settle();
  const second: createRecordedFilmSubject.ICall[] = calls.splice(0);
  mounted.dispose();
  TestValidator.predicate(
    "the live entry is placed last and observed with place",
    errors.length === 0 &&
      same(second, [
        step("seek", null, 1.75),
        step("inspect", null, 1.75, 1),
        step("marks", null, 1.75),
      ]),
  );
}

/** A step with its name, its shot and its numbers. */
function step(
  name: string,
  shot: string | null = null,
  ...numbers: number[]
): createRecordedFilmSubject.ICall {
  return { name, shot, numbers };
}

/** Whether two step lists agree in names and shots, and in numbers to 1e-9. */
function same(
  actual: readonly createRecordedFilmSubject.ICall[],
  expected: readonly createRecordedFilmSubject.ICall[],
): boolean {
  return (
    actual.length === expected.length &&
    actual.every(
      (entry: createRecordedFilmSubject.ICall, index: number): boolean =>
        entry.name === expected[index]!.name &&
        entry.shot === expected[index]!.shot &&
        entry.numbers.length === expected[index]!.numbers.length &&
        entry.numbers.every((value: number, k: number): boolean =>
          nclose(value, expected[index]!.numbers[k]!, 1e-9),
        ),
    )
  );
}

/** Let every pending promise reaction run: a macrotask follows the queue. */
function settle(): Promise<void> {
  return new Promise<undefined>((resolve: (value: undefined) => void): void => {
    setImmediate((): void => resolve(undefined));
  });
}
