import { resolveAutoMovieLensAt } from "@automovie/engine";
import type { IAutoMovieCameraIntent } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * A timed focus pull eases the focused depth between its two marks, starting
 * and landing with zero rate.
 *
 * Scenarios:
 *
 * 1. For a static camera at the origin looking down −Z, a pull from a mark 2 m
 *    deep to one 4 m deep with `start` 1 s and `end` 2 s resolves 2 m at 0.5 s,
 *    3 m at 1.5 s and 4 m at 2.5 s.
 * 2. At 1.25 s, a quarter through, the depth is 2 + 2 × s(0.25) = 2.3125 m with
 *    s(u) = u²(3 − 2u).
 * 3. The depth's rate just after the start and just before the end is near zero,
 *    while at the middle it is the peak 1.5 × (z1 − z0) / (end − start) = 3
 *    m/s.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the exported resolver across the pull; a linear ramp, a missing hold before or after, or marks measured at the wrong second fail.
 * @evidence contracts/development/testing.md#independent-expectations Values are the issue's worked example and the smoothstep polynomial evaluated by hand; the middle rate is its derivative 6u(1 − u) at u = 0.5 times the 2 m span over 1 s.
 * @evidence contracts/development/testing.md#distinguishing-cases Before, during and after the pull, a quarter point, and both ends' rates. Intent selection belongs to test_film_camera_lens_resolve.
 * @evidence contracts/development/testing.md#execution-ownership Portable CPU unit test discovered by its export name.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios with times and expected depths.
 */
export function test_film_camera_lens_pull(): void {
  const intent: IAutoMovieCameraIntent = {
    start: 0,
    framing: "medium",
    move: "static",
    focus: { x: 0, y: 0, z: -2 },
    focusPull: { start: 1, end: 2, to: { x: 0, y: 0, z: -4 } },
    focalLength: null,
    fNumber: 2,
  };
  const depth: (seconds: number) => number = (seconds: number): number =>
    resolveAutoMovieLensAt({
      intents: [intent],
      seconds,
      position: { x: 0, y: 0, z: 0 },
      forward: { x: 0, y: 0, z: -1 },
    })?.focusDistance ?? Number.NaN;

  TestValidator.predicate(
    "the pull holds, eases and lands",
    nclose(depth(0.5), 2, 1e-12) &&
      nclose(depth(1.5), 3, 1e-12) &&
      nclose(depth(2.5), 4, 1e-12),
  );
  TestValidator.predicate(
    "a quarter through follows the smoothstep",
    nclose(depth(1.25), 2.3125, 1e-12),
  );
  const h: number = 1e-4;
  const rate: (seconds: number) => number = (seconds: number): number =>
    (depth(seconds + h) - depth(seconds - h)) / (2 * h);
  TestValidator.predicate(
    "the rate is zero at both marks and peaks mid-pull",
    Math.abs(rate(1 + h)) < 0.01 &&
      Math.abs(rate(2 - h)) < 0.01 &&
      nclose(rate(1.5), 3, 1e-3),
  );
}
