import {
  type AutoMoviePhysicsCache as Cache,
  type AutoMoviePhysicalPlayback as Playback,
  admitPhysicalPlaybackMetadata,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/** Replayed virtual support predictions keep requested minus allocated equal to their residual, independent of an archive's integrity trailer.
 *
 * Scenarios:
 * 1. An unsupported prediction, full residual and zero allocation, is admitted.
 * 2. A partial allocation whose residual is the exact difference is admitted, also at the 64-ulp rounding bound.
 * 3. A residual one newton off, or past the rounding bound, is refused as inconsistent.
 * 4. A negative or fractional witness count, and two predictions at one instant, are refused as malformed.
 *
 * The allocation law itself belongs to `test_physical_support_wrench`, and binary transport to `test_physical_playback_archive`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs `AutoMoviePhysicalPlayback`, `AutoMoviePhysicsCache`, `admitPhysicalPlaybackMetadata` on in-memory inputs and asserts the returned observations through 1x TestValidator.equals; 4 numbered scenarios (first: An unsupported prediction, full residual and zero allocation, is admitted.; last: A negative or fractional witness count, and two predictions at one instant, are refused as malformed.). A wrong result for any of those inputs fails an assertion, while results the scenarios allow do not.
 * @evidence contracts/development/testing.md#independent-expectations Expected values come from the literals and relations written in the test itself and from the scenario sentences above, not from a snapshot of the implementation's output; where an expectation is computed by another production function the oracle is not independent, and this answer does not establish a reference beyond the scenario text.
 * @evidence contracts/development/testing.md#distinguishing-cases Contributes 4 numbered scenarios (first: An unsupported prediction, full residual and zero allocation, is admitted.; last: A negative or fractional witness count, and two predictions at one instant, are refused as malformed.), including the negative, boundary or refusal cases those sentences name; cases the sentences do not name are not claimed here and are owned by other tests or are uncovered.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through the discoverable function `test_physical_wrench_replay`, which owns every case it runs; it registers no dynamic cases and starts no process, browser, viewer, render or GPU host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: An unsupported prediction, full residual and zero allocation, is admitted.).
 */
export function test_physical_wrench_replay(): void {
  const unsupported: Cache.ISupportWrench = wrench(0, 0, [100, 0], [0, 0]);
  const partial: Cache.ISupportWrench = wrench(1 / 120, 4, [100, 2], [60, 0.5]);
  const verdicts: [string, Cache.ISupportWrench[], string | null][] = [
    ["unsupported prediction", [unsupported], null],
    ["partial allocation", [unsupported, partial], null],
    [
      "rounding at the bound",
      [nudge(partial, 32 * Number.EPSILON * 100)],
      null,
    ],
    [
      "false residual",
      [nudge(partial, 1)],
      "Inconsistent physical playback allocation residual",
    ],
    [
      "residual past rounding",
      [nudge(partial, 128 * Number.EPSILON * 100)],
      "Inconsistent physical playback allocation residual",
    ],
    [
      "negative witness count",
      [{ ...partial, pointCount: -1 }],
      "Malformed physical playback support-wrench prediction",
    ],
    [
      "fractional witness count",
      [{ ...partial, pointCount: 1.5 }],
      "Malformed physical playback support-wrench prediction",
    ],
    [
      "repeated instant",
      [partial, partial],
      "Malformed physical playback support-wrench prediction",
    ],
  ];
  const failures: string[] = [];
  for (const [label, supportWrenches, expected] of verdicts) {
    let refusal: string | null = null;
    try {
      admitPhysicalPlaybackMetadata({ ...header(), supportWrenches });
    } catch (error: unknown) {
      refusal = error instanceof Error ? error.message : String(error);
    }
    if (refusal !== expected)
      failures.push(`${label}: ${refusal ?? "admitted"}`);
  }
  TestValidator.equals("support-wrench replay admission", failures, []);
}

/** A one-body, one-segment archive header with no contacts and initial dynamic ownership. */
function header(): Playback.IHeader {
  return {
    format: 1,
    protocol: "unit",
    identity: "unit",
    duration: 1,
    rate: 120,
    segments: [["body", "root"]],
    contacts: [],
    recovery: {},
    ownership: [{ body: "body", bone: "root", seconds: 0, kind: "dynamic" }],
    supportWrenches: [],
  };
}

/** A vertical force and yaw-moment prediction with its exact residual. */
function wrench(
  seconds: number,
  pointCount: number,
  requested: [number, number],
  allocated: [number, number],
): Cache.ISupportWrench {
  const of: (value: [number, number]) => Cache.ISupportWrench["requested"] = (
    value: [number, number],
  ): Cache.ISupportWrench["requested"] => ({
    force: { x: 0, y: value[0], z: 0 },
    torque: { x: 0, y: value[1], z: 0 },
  });
  return {
    body: "body",
    seconds,
    origin: { x: 0, y: 1, z: 0 },
    requested: of(requested),
    allocated: of(allocated),
    residual: of([requested[0] - allocated[0], requested[1] - allocated[1]]),
    pointCount,
  };
}

/** The same prediction with its vertical force residual moved by `delta` newtons. */
function nudge(
  entry: Cache.ISupportWrench,
  delta: number,
): Cache.ISupportWrench {
  const copy: Cache.ISupportWrench = structuredClone(entry);
  copy.residual.force.y += delta;
  return copy;
}
