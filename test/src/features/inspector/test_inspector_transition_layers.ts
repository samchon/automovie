import type { IAutoMovieInspectionRequest } from "@automovie/interface";
import {
  AutoMovieInspectorTransition,
  readAutoMovieInspectorAddress,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createRecordedFilmSubject } from "../draw/createRecordedFilmSubject";
import { createDisplayCompositionRenderer } from "../internal/createDisplayCompositionRenderer";
import { nclose } from "../internal/nclose";

/**
 * The Viewer's transition places a painted second's layers as the draw page
 * does: every other layer of positive weight painted and held first, the shot
 * the picture shows most of placed last, the held layers composited after its
 * records, and the witness overlay drawn over the composite.
 *
 * Scenarios, on shot A from 0 to 2 s on its clock 1 + t and shot B from 1 s
 * through a one-second transition:
 *
 * 1. A dissolve's first half, 1.25 s, plain beauty: B is placed by `seek`, fed by
 *    `beforeDraw`, painted and held before the shown outgoing A is placed last
 *    by `seekShot` at its own clock; `byShot` is true, and `finish` paints A,
 *    holds it and mixes the two held pictures at the incoming weight 0.25.
 * 2. Its second half, 1.75 s: A is placed by `seekShot`, painted and held first,
 *    the live B placed last by `seek`, `byShot` is false, and the mix is 0.75.
 * 3. A fade's midpoint, 1.5 s: only the live entry is placed, nothing is painted
 *    or held, and `finish` clears the canvas without compositing.
 * 4. An inspection request, or no compositor, inside the dissolve's first half
 *    places only the outgoing shot, last, and `finish` paints nothing.
 * 5. `over` draws an attached overlay onto the canvas without clearing it and
 *    restores the clear policy; an empty overlay draws nothing.
 * 6. A transition disposed while a held layer is being placed paints and holds
 *    nothing.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Drives `AutoMovieInspectorTransition` over a recording subject and the display compositor double and asserts the placements, `beforeDraw`, paints, canvas copies, compositor mixes and clears; a live entry placed last in a first half, a dropped hold, a layer of weight 0 painted, an overlay that clears the composite or a paint after dispose fails.
 * @evidence contracts/development/testing.md#independent-expectations The weights follow from the dissolve's linear mix and the fade's dip by hand and the shot clocks from the hand-laid cut; the compositor's mix is the incoming weight by its contract.
 * @evidence contracts/development/testing.md#distinguishing-cases Both halves of a dissolve, a fade's empty midpoint, inspection and compositor-less pictures, a full and an empty overlay and disposal; the mount's use of it belongs to `test_inspector_scene_transition` and the pixels to the SwiftShader capture.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_inspector_transition_layers`; the compositor is the in-memory double and no GPU starts.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export async function test_inspector_transition_layers(): Promise<void> {
  // 1. A dissolve's first half.
  const first: IRun = await run("crossDissolve", 1.25);
  const heldFirst: number = first.host.copied.length;
  TestValidator.predicate(
    "the live entry is painted and held before the outgoing shot is placed last",
    same(first.subject.calls, [
      step("seek", null, 1.25),
      step("beforeDraw", null, 1.25),
      step("paint"),
      step("seekShot", "shot:a", 2.25, 1.25),
    ]) &&
      heldFirst === 1 &&
      first.transition.byShot &&
      first.transition.composites,
  );
  first.subject.calls.length = 0;

  // The mix replays slot 0, which is refused unless it was held.
  const mixed: boolean = first.transition.finish(first.paint);
  TestValidator.predicate(
    "finish paints and holds the shown shot and mixes both",
    mixed &&
      same(first.subject.calls, [step("paint")]) &&
      !first.host.rendered.at(-1)!.fade &&
      nclose(first.host.rendered.at(-1)!.alpha, 0.25, 0),
  );

  // 2. Its second half.
  const second: IRun = await run("crossDissolve", 1.75);
  const heldSecond: number = second.host.copied.length;
  second.transition.finish(second.paint);
  TestValidator.predicate(
    "the outgoing shot is held first and the live entry placed last",
    same(second.subject.calls, [
      step("seekShot", "shot:a", 2.75, 1.75),
      step("beforeDraw", null, 1.75),
      step("paint"),
      step("seek", null, 1.75),
      step("paint"),
    ]) &&
      heldSecond === 1 &&
      !second.transition.byShot &&
      nclose(second.host.rendered.at(-1)!.alpha, 0.75, 0),
  );

  // 3. A fade's midpoint.
  const midpoint: IRun = await run("fade", 1.5);
  const cleared: boolean = midpoint.transition.finish(midpoint.paint);
  TestValidator.predicate(
    "a fade's midpoint paints nothing and clears the canvas",
    cleared &&
      same(midpoint.subject.calls, [step("seek", null, 1.5)]) &&
      midpoint.host.copied.length === 0 &&
      midpoint.host.calls.includes("clear") &&
      midpoint.host.rendered.length === 0,
  );

  // 4. An inspection picture and a picture without a compositor.
  const marked: IRun = await run("crossDissolve", 1.25, "marks=curve");
  const bare: IRun = await run("crossDissolve", 1.25, "", false);
  TestValidator.predicate(
    "only the shown outgoing shot is placed and nothing is composited",
    [marked, bare].every(
      (entry: IRun): boolean =>
        entry.transition.byShot &&
        !entry.transition.composites &&
        !entry.transition.finish(entry.paint) &&
        same(entry.subject.calls, [step("seekShot", "shot:a", 2.25, 1.25)]),
    ),
  );

  // 5. The overlay over the composite.
  const overlay: IRun = await run("crossDissolve", 1.25);
  overlay.host.calls.length = 0;
  overlay.transition.over(new THREE.PerspectiveCamera());
  const empty: string[] = [...overlay.host.calls];
  overlay.transition.overlay.add(
    new THREE.Mesh(new THREE.PlaneGeometry(), new THREE.MeshBasicMaterial()),
  );
  overlay.host.calls.length = 0;
  overlay.transition.over(new THREE.PerspectiveCamera());
  TestValidator.equals(
    "an overlay is drawn over the canvas without clearing it",
    [empty, overlay.host.calls],
    [[], ["screen", "compositeAuto", "sourceRender", "restoreAuto", "screen"]],
  );

  // 6. Disposal during a placement.
  const disposed: IRun = await run("crossDissolve", 1.25, "", true, true);
  TestValidator.predicate(
    "a disposed transition paints and holds nothing",
    disposed.host.copied.length === 0 &&
      !disposed.subject.calls.some(
        (call: createRecordedFilmSubject.ICall): boolean =>
          call.name === "paint",
      ),
  );
}

/** One placed second and what it recorded. */
interface IRun {
  /** The transition under test. */
  transition: AutoMovieInspectorTransition;

  /** The compositor double. */
  host: ReturnType<typeof createDisplayCompositionRenderer>;

  /** The recording subject, whose call list also holds every paint. */
  subject: createRecordedFilmSubject.IDouble;

  /** The paint callback, which records `paint`. */
  paint: () => void;
}

/**
 * Place one second of the two-shot cut through a fresh transition, or with
 * `dispose` dispose it while its first placement is pending.
 */
async function run(
  kind: "crossDissolve" | "fade",
  seconds: number,
  address: string = "",
  compositor: boolean = true,
  dispose: boolean = false,
): Promise<IRun> {
  const subject: createRecordedFilmSubject.IDouble = createRecordedFilmSubject({
    transition: { kind, duration: 1 },
    seekShot: true,
    optics: false,
  });
  const host: ReturnType<typeof createDisplayCompositionRenderer> =
    createDisplayCompositionRenderer();
  const paint: () => void = (): void => {
    subject.calls.push({ name: "paint", shot: null, numbers: [] });
  };
  const transition: AutoMovieInspectorTransition =
    new AutoMovieInspectorTransition();
  const request: IAutoMovieInspectionRequest =
    readAutoMovieInspectorAddress(address).inspection;
  const placed: Promise<void> = transition.place({
    name: "film",
    instance: subject.subject,
    request,
    compositor: compositor ? host.renderer : null,
    seconds,
    paint,
  });
  if (dispose) transition.dispose();
  await placed;
  return { transition, host, subject, paint };
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
