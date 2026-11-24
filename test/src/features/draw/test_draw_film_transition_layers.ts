import { planAutoMovieFilmSamples } from "@automovie/engine";
import type {
  AutoMovieInspectionShade,
  IAutoMovieFilmOptics,
} from "@automovie/interface";
import {
  AutoMovieDrawFilm,
  placeAutoMovieDrawLayer,
  planAutoMovieDrawPicture,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/nclose";
import { createRecordedFilmSubject } from "./createRecordedFilmSubject";

/** One step of a picture: the subject's calls and the beauty owner's. */
interface IStep {
  /** The call's name. */
  name: string;

  /** The shot `seekShot` placed, or null. */
  shot: string | null;

  /** The call's numbers: seconds, times, slots or weights. */
  numbers: number[];
}

/**
 * A draw call's picture places, samples, draws, holds and composites a
 * transition's layers on their own entry clocks, places the shot the picture
 * shows most of last, and draws the graphics plate through a transition as the
 * picture is drawn.
 *
 * Scenarios, on shot A from 0 to 2 s on its clock 1 + t, then shot B from 1 s
 * through a one-second transition, or from 2 s at a hard cut, with a 180°
 * shutter over two samples at 24 fps where optics are given:
 *
 * 1. A dissolve's first half, 1.25 s, without optics: the live entry B is placed
 *    by `seek`, fed by `beforeDraw`, drawn and held in slot 1 before the shown
 *    outgoing shot A, which the host places by `seekShot` at its own clock 2.25
 *    s; drawing it holds slot 0 and composites A at 0.75 and B at 0.25.
 * 2. With optics, the same frame samples B, `seek` at each sample, and then A,
 *    `seekShot` at A's clock at each sample, every placement followed by
 *    `beforeDraw`, before the host places A.
 * 3. A dissolve's second half, 1.75 s: A is held in slot 0 through `seekShot` at
 *    its clock 2.75 s, `byShot` is false because the live entry is shown, and
 *    drawing holds slot 1 and composites A at 0.25 and B at 0.75.
 * 4. A dissolve's first frame, 1 s: the live entry at weight 0 is neither placed
 *    nor drawn, and only A at weight 1 is composited.
 * 5. A fade's midpoint, 1.5 s: the picture places nothing, draws nothing and is
 *    the cleared canvas; its first quarter, 1.25 s, draws A alone, held in slot
 *    0, composited at 0.5.
 * 6. The `graphics` plate inside a dissolve's first half holds B's plate under the
 *    plate's render mode, its backdrop removed, composites both plates by their
 *    weights toward alpha 0, and restores the backdrop.
 * 7. At a hard cut's first frame, 2 s, with optics, B's two shutter samples before
 *    its start are placed by `seekShot` at B's handle, −1/64 and −1/192 s, and
 *    the frame by `seek`; without `seekShot` the frame is drawn, both samples
 *    held at B's in-point by `seek` at 2 s, and no sample places A.
 * 8. An inspection picture inside the dissolve's first half composites nothing and
 *    samples nothing, and `byShot` still names the outgoing shot.
 * 9. The canvas's clear alpha is set before the shown layer's samples are drawn.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Drives `AutoMovieDrawFilm`, the draw page's picture, over a recording subject and beauty owner and asserts the order and arguments of every placement, reading, draw, hold and composite; a swapped slot, a missing hold, a live entry placed last, an outgoing shot on the film clock, a dropped `beforeDraw`, a weight-0 layer drawn, a plate cut at the transition, a sample on the previous shot or a cut refused without `seekShot` fails.
 * @evidence contracts/development/testing.md#independent-expectations The weights follow from the dissolve's linear mix and the fade's dip by hand, the shot clocks from the hand-laid cut, and the sample seconds from the strata midpoints of the trailing 1/48 s interval.
 * @evidence contracts/development/testing.md#distinguishing-cases Both halves of a dissolve and of a fade, their zero-weight frames, the plate, a hard cut with and without `seekShot`, an inspection picture, with and without optics; pixels belong to the SwiftShader capture and the layer weights to `test_film_playback_layers`.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_film_transition_layers`; the subject and the beauty owner are recording doubles and no GPU starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 9 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export async function test_draw_film_transition_layers(): Promise<void> {
  const dissolve: "crossDissolve" | "fade" = "crossDissolve";

  // 1. A dissolve's first half without optics.
  const first: IPicture = picture({ kind: dissolve, seconds: 1.25 });
  await first.film.prepare();
  TestValidator.predicate(
    "the live entry is placed, fed, drawn and held in slot 1 first",
    same(first.steps(), [
      step("restore"),
      step("prepare"),
      step("sample"),
      step("seek", null, 1.25),
      step("beforeDraw", null, 1.25),
      step("prepare"),
      step("draw"),
      step("hold", null, 1),
    ]),
  );
  first.clear();
  await first.placeShown(1.25);
  first.film.draw(first.camera);
  TestValidator.predicate(
    "the outgoing shot is placed last on its own clock, held in slot 0 and both composited",
    same(first.steps(), [
      step("seekShot", "shot:a", 2.25, 1.25),
      step("draw"),
      step("hold", null, 0),
      step("composite", null, 0.75, 0, 0.25, 1, 0),
    ]),
  );

  // 2. The same frame with optics.
  const sampled: IPicture = picture({
    kind: dissolve,
    seconds: 1.25,
    optics: true,
  });
  await sampled.film.prepare();
  const at: number[] = planAutoMovieFilmSamples({
    seconds: 1.25,
    fps: 24,
    optics: OPTICS,
    fovY: 45,
  }).map((sample: { seconds: number }): number => sample.seconds);
  TestValidator.predicate(
    "each layer's samples are placed on its own clock and fed",
    same(sampled.steps(), [
      step("restore"),
      step("prepare"),
      step("sample"),
      step("seek", null, 1.25),
      step("beforeDraw", null, 1.25),
      step("optics", null, 1.25),
      ...at.flatMap((second: number): IStep[] => [
        step("seek", null, second),
        step("beforeDraw", null, second),
      ]),
      step("seek", null, 1.25),
      step("beforeDraw", null, 1.25),
      step("prepare"),
      step("draw", null, 1),
      step("hold", null, 1),
      step("restore"),
      step("prepare"),
      step("sample"),
      step("seekShot", "shot:a", 2.25, 1.25),
      step("beforeDraw", null, 1.25),
      step("optics", null, 1.25),
      ...at.flatMap((second: number): IStep[] => [
        step("seekShot", "shot:a", 1 + second, second),
        step("beforeDraw", null, second),
      ]),
      step("seekShot", "shot:a", 2.25, 1.25),
      step("beforeDraw", null, 1.25),
    ]),
  );

  // 3. A dissolve's second half.
  const second: IPicture = picture({ kind: dissolve, seconds: 1.75 });
  await second.film.prepare();
  const shownLive: boolean = !second.film.byShot;
  second.film.draw(second.camera);
  TestValidator.predicate(
    "the outgoing shot is held in slot 0 and the shown live entry drawn last",
    shownLive &&
      same(second.steps(), [
        step("restore"),
        step("prepare"),
        step("sample"),
        step("seekShot", "shot:a", 2.75, 1.75),
        step("beforeDraw", null, 1.75),
        step("prepare"),
        step("draw"),
        step("hold", null, 0),
        step("draw"),
        step("hold", null, 1),
        step("composite", null, 0.25, 0, 0.75, 1, 0),
      ]),
  );

  // 4. A dissolve's first frame.
  const opening: IPicture = picture({ kind: dissolve, seconds: 1 });
  await opening.film.prepare();
  await opening.placeShown(1);
  opening.film.draw(opening.camera);
  TestValidator.predicate(
    "a live entry at weight 0 is neither placed nor drawn",
    same(opening.steps(), [
      step("seekShot", "shot:a", 2, 1),
      step("draw"),
      step("hold", null, 0),
      step("composite", null, 1, 0, 0),
    ]),
  );

  // 5. A fade.
  const midpoint: IPicture = picture({ kind: "fade", seconds: 1.5 });
  await midpoint.film.prepare();
  midpoint.film.draw(midpoint.camera);
  const quarter: IPicture = picture({ kind: "fade", seconds: 1.25 });
  await quarter.film.prepare();
  await quarter.placeShown(1.25);
  quarter.film.draw(quarter.camera);
  TestValidator.predicate(
    "a fade's midpoint is the cleared canvas and its first quarter the outgoing shot alone",
    same(midpoint.steps(), [step("clear")]) &&
      same(quarter.steps(), [
        step("seekShot", "shot:a", 2.25, 1.25),
        step("draw"),
        step("hold", null, 0),
        step("composite", null, 0.5, 0, 0),
      ]),
  );

  // 6. The graphics plate.
  const plate: IPicture = picture({
    kind: dissolve,
    seconds: 1.25,
    shade: "graphics",
  });
  await plate.film.prepare();
  await plate.placeShown(1.25);
  plate.film.draw(plate.camera);
  TestValidator.predicate(
    "the plate goes through the dissolve as the picture does",
    same(plate.steps(), [
      step("restore"),
      step("prepare"),
      step("seek", null, 1.25),
      step("beforeDraw", null, 1.25),
      step("plate", null, 0),
      step("hold", null, 1),
      step("seekShot", "shot:a", 2.25, 1.25),
      step("plate", null, 1),
      step("hold", null, 0),
      step("composite", null, 0.75, 0, 0.25, 1, 1),
    ]) && plate.subject.subject.scene.background !== null,
  );

  // 7. A hard cut with a shutter.
  const cut: IPicture = picture({ kind: null, seconds: 2, optics: true });
  await cut.film.prepare();
  const handles: IStep[] = cut
    .steps()
    .filter((entry: IStep): boolean => entry.name.startsWith("seek"));
  const bare: IPicture = picture({
    kind: null,
    seconds: 2,
    optics: true,
    seekShot: false,
  });
  await bare.film.prepare();
  const held: IStep[] = bare
    .steps()
    .filter((entry: IStep): boolean => entry.name.startsWith("seek"));
  TestValidator.predicate(
    "a cut's first frame samples only the incoming shot, from its handle",
    cut.film.layers === null &&
      !cut.film.byShot &&
      same(handles, [
        step("seek", null, 2),
        step("seekShot", "shot:b", -1 / 64, 2 - 1 / 64),
        step("seekShot", "shot:b", -1 / 192, 2 - 1 / 192),
        step("seek", null, 2),
      ]) &&
      same(held, [
        step("seek", null, 2),
        step("seek", null, 2),
        step("seek", null, 2),
        step("seek", null, 2),
      ]),
  );

  // 8. An inspection picture.
  const inspection: IPicture = picture({
    kind: dissolve,
    seconds: 1.25,
    optics: true,
    film: false,
  });
  await inspection.film.prepare();
  await inspection.placeShown(1.25);
  inspection.film.draw(inspection.camera);
  TestValidator.predicate(
    "an inspection picture follows the shown shot alone",
    !inspection.film.composites &&
      inspection.film.byShot &&
      same(inspection.steps(), [
        step("seekShot", "shot:a", 2.25, 1.25),
        step("draw"),
      ]),
  );

  // 9. The canvas is prepared before the shown layer's samples.
  const live: IPicture = picture({ kind: null, seconds: 0.5, optics: true });
  await live.film.prepare();
  TestValidator.predicate(
    "the clear alpha is set before any sample is drawn",
    same(live.steps().slice(0, 3), [
      step("restore"),
      step("prepare"),
      step("sample"),
    ]),
  );
}
/** The optics the recording subject answers. */
const OPTICS: IAutoMovieFilmOptics = {
  ev100: 10,
  toneMapping: "none",
  samples: 2,
  shutter: { angle: 180 },
};

/** One planned picture over a recording subject and beauty owner. */
interface IPicture {
  /** The picture under test. */
  film: AutoMovieDrawFilm;

  /** The recording subject. */
  subject: createRecordedFilmSubject.IDouble;

  /** The camera the host would draw through. */
  camera: THREE.Camera;

  /** Every step so far: the subject's calls merged with the owner's. */
  steps: () => IStep[];

  /** Forget the steps so far. */
  clear: () => void;

  /** Place the shown shot at a second, as the host's placement does. */
  placeShown: (seconds: number) => Promise<void>;
}

/** Plan a picture at a second of the two-shot cut, recording every step. */
function picture(props: {
  kind: "crossDissolve" | "fade" | null;
  seconds: number;
  shade?: AutoMovieInspectionShade;
  optics?: boolean;
  seekShot?: boolean;
  film?: boolean;
}): IPicture {
  const subject: createRecordedFilmSubject.IDouble = createRecordedFilmSubject({
    transition: props.kind === null ? null : { kind: props.kind, duration: 1 },
    seekShot: props.seekShot ?? true,
    optics: props.optics ?? false,
  });

  // The owner's steps join the subject's call list, so their order is one.
  const record: (name: string, ...numbers: number[]) => void = (
    name: string,
    ...numbers: number[]
  ): void => {
    subject.calls.push({ name, shot: null, numbers });
  };
  const beauty: AutoMovieDrawFilm.IProps["beauty"] = {
    sample: async (
      layer: Parameters<AutoMovieDrawFilm.IProps["beauty"]["sample"]>[0],
    ): Promise<IAutoMovieFilmOptics | undefined> => {
      record("sample");
      // As `AutoMovieDrawBeauty.sample` and the accumulation place a layer.
      await layer.seek(layer.seconds);
      const optics: IAutoMovieFilmOptics | undefined = layer.scene.optics?.(
        layer.seconds,
      );
      if (optics?.samples === undefined) return undefined;
      for (const sample of planAutoMovieFilmSamples({
        seconds: layer.seconds,
        fps: layer.scene.fps,
        optics,
        fovY: 45,
      }))
        await layer.seek(sample.seconds);
      await layer.seek(layer.seconds);
      return optics;
    },
    draw: (
      layer: Parameters<AutoMovieDrawFilm.IProps["beauty"]["draw"]>[0],
    ): void => {
      if (layer.sampled === undefined) record("draw");
      else record("draw", 1);
    },
    plate: (
      layer: Parameters<AutoMovieDrawFilm.IProps["beauty"]["plate"]>[0],
    ): void => record("plate", layer.scene.scene.background === null ? 0 : 1),
    hold: (slot: number): void => record("hold", slot),
    composite: (
      layers: readonly { weight: number; slot: number }[],
      transparent: boolean,
    ): void =>
      record(
        "composite",
        ...layers.flatMap(
          (layer: { weight: number; slot: number }): number[] => [
            layer.weight,
            layer.slot,
          ],
        ),
        transparent ? 1 : 0,
      ),
  };
  const renderer: THREE.WebGLRenderer = {
    setRenderTarget: (): void => {},
    clear: (): void => record("clear"),
  } as unknown as THREE.WebGLRenderer;
  const camera: THREE.Camera = new THREE.PerspectiveCamera();
  const film: AutoMovieDrawFilm = new AutoMovieDrawFilm({
    name: "film",
    scene: subject.subject,
    renderer,
    beauty,
    shade: props.shade ?? "beauty",
    seconds: props.seconds,
    width: 64,
    height: 36,
    transparent: props.shade === "graphics",
    film: props.film ?? true,
    camera: (): THREE.Camera => camera,
    prepare: (): void => record("prepare"),
    restore: (): void => record("restore"),
    voice: (): void => {},
  });
  return {
    film,
    subject,
    camera,
    steps: (): IStep[] => subject.calls.map((call: IStep): IStep => call),
    clear: (): void => {
      subject.calls.length = 0;
    },
    placeShown: (seconds: number): Promise<void> =>
      placeAutoMovieDrawLayer(
        "film",
        subject.subject,
        planAutoMovieDrawPicture("film", subject.subject, seconds).placed,
        seconds,
      ),
  };
}

/** A step with its name, its shot and its numbers. */
function step(
  name: string,
  shot: string | null = null,
  ...numbers: number[]
): IStep {
  return { name, shot, numbers };
}

/** Whether two step lists agree in names and shots, and in numbers to 1e-9. */
function same(actual: readonly IStep[], expected: readonly IStep[]): boolean {
  return (
    actual.length === expected.length &&
    actual.every(
      (entry: IStep, index: number): boolean =>
        entry.name === expected[index]!.name &&
        entry.shot === expected[index]!.shot &&
        entry.numbers.length === expected[index]!.numbers.length &&
        entry.numbers.every((value: number, k: number): boolean =>
          nclose(value, expected[index]!.numbers[k]!, 1e-9),
        ),
    )
  );
}
