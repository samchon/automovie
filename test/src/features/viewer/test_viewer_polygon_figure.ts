import {
  type AutoMovieHumanPolygon,
  createAutoMovieHumanPolygonFigure,
} from "@automovie/render";
import { planAutoMovieAudioPlayback } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import type * as THREE from "three";

import { createHumanPolygonFixture } from "../internal/createHumanPolygonFixture";

/** The polygon figure rebuilds its face only on a changed head pose or expression, and audio playback plans every cue from any instant.
 *
 * Scenarios:
 * 1. Placing the same expression twice keeps one face object; a changed expression replaces it, and the head carries exactly one face.
 * 2. Disposal is once only and a later placement refuses.
 * 3. From 1 s at double speed: an ended cue is skipped, a sounding cue starts at once part-way in, and a later cue waits its film delay over the rate.
 * 4. An unknown asset and a nonpositive rate are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `viewer`, `human-polygon` on in-memory inputs and asserts the returned observations through 3x TestValidator.predicate, 1x TestValidator.equals; 4 numbered scenarios (first: Placing the same expression twice keeps one face object; a changed expression replaces it, and the head...; last: An unknown asset and a nonpositive rate are refused.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself (2 assertion sites compare against numeric literals) and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 4 numbered scenarios (first: Placing the same expression twice keeps one face object; a changed expression replaces it, and the head...; last: An unknown asset and a nonpositive rate are refused.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_viewer_polygon_figure`, which owns the cases delegated to `createHumanPolygonFixture`; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Placing the same expression twice keeps one face object; a changed expression replaces it, and the head carries exactly one face.).
 */
export function test_viewer_polygon_figure(): void {
  const input: AutoMovieHumanPolygon.IInput = createHumanPolygonFixture();
  const figure: createAutoMovieHumanPolygonFigure.IFigure =
    createAutoMovieHumanPolygonFigure({ evaluate: () => input });
  const faces = (): THREE.Object3D[] =>
    figure.drawing.head.object.children.filter(
      (child: THREE.Object3D): boolean => child.type === "Group",
    );
  figure.place(input);
  const neutral: THREE.Object3D[] = faces();
  figure.place(input);
  const held: THREE.Object3D[] = faces();
  figure.place(input, undefined, {
    units: [{ unit: "lipCornerPuller", intensity: 0.3, side: "both" }],
  });
  const smiling: THREE.Object3D[] = faces();
  TestValidator.predicate(
    "face rebuilt only on change",
    neutral.length === 1 &&
      held.length === 1 &&
      held[0] === neutral[0] &&
      smiling.length === 1 &&
      smiling[0] !== neutral[0],
  );
  figure.dispose();
  figure.dispose();
  let refused: boolean = false;
  try {
    figure.place(input);
  } catch {
    refused = true;
  }
  TestValidator.predicate("disposed figure refuses", refused);

  // Playback planning from 1 s at double speed.
  const plan: planAutoMovieAudioPlayback.IStart[] = planAutoMovieAudioPlayback(
    [
      { asset: "a", seconds: 0, gain: 1, durationSeconds: 0.5 },
      { asset: "a", seconds: 0.8, gain: 0.5, pan: -0.5, rate: 2 },
      { asset: "b", seconds: 2, gain: 1, offsetSeconds: 0.25 },
    ],
    1,
    2,
    { a: 1, b: 1 },
  );
  const close = (x: number, y: number): boolean => Math.abs(x - y) < 1e-12;
  TestValidator.predicate(
    "planned starts",
    plan.length === 2 &&
      plan[0]!.asset === "a" &&
      close(plan[0]!.delay, 0) &&
      close(plan[0]!.offset, 0.4) &&
      close(plan[0]!.duration, (0.5 - 0.2) / 2) &&
      close(plan[0]!.playbackRate, 4) &&
      plan[0]!.pan === -0.5 &&
      plan[1]!.asset === "b" &&
      close(plan[1]!.delay, 0.5) &&
      close(plan[1]!.offset, 0.25) &&
      close(plan[1]!.duration, 0.75 / 2),
  );
  const refusals: string[] = [];
  for (const [label, run] of [
    [
      "unknown asset",
      () =>
        planAutoMovieAudioPlayback(
          [{ asset: "z", seconds: 0, gain: 1 }],
          0,
          1,
          {},
        ),
    ],
    ["zero rate", () => planAutoMovieAudioPlayback([], 0, 0, {})],
  ] as const)
    try {
      run();
      refusals.push(`${label} accepted`);
    } catch {}
  TestValidator.equals("playback refusals", refusals, []);
}
