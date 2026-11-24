import { createLongCane } from "@automovie/archetypes";
import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanRefusal } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { caneSweepScene } from "../../internal/caneSweepScene";

/**
 * What a short cane's refusal names, by the caneSweep's documented contract: "a
 * cane too short to reach the floor ahead … is refused".
 */
const NAMED: RegExp = /reach the floor/;

/**
 * A cane too short to reach the floor from the hand is refused for that reason,
 * and the cane fitted to the body is not: the refusal case of
 * `test_motion_gait_cane_sweep` with its adjacent valid case, on the average
 * man in the two-point technique as the original, entered by the minimal chain
 * pickUp(cane) > walk with the caneSweep overlay.
 *
 * Scenarios:
 *
 * 1. The shortest cane the archetype makes is refused on the `prop` axis, and the
 *    refusal names the floor the cane cannot reach.
 * 2. The cane fitted to the sternum, the same chain otherwise, is not refused.
 *
 * The original's check 5 asserts the axis alone, which every fitted cane now
 * meets too (refused on `prop` for the hand's attitude), so it passes whatever
 * the sweep does; the reason named here and the adjacent fitted cane make the
 * case distinguish.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original's refusal, why it was vacuous, the adjacent case, the entry chain and the body.
 * @evidence contracts/development/testing.md#behavioral-verification Builds both takes through `HumanPerformance` and reads the refusal's axis and reason or its absence; an admitted short cane, a short cane refused for another reason, or a refused fitted cane fails.
 * @evidence contracts/development/testing.md#independent-expectations The caneSweep's public contract states the refusal ("a cane too short to reach the floor ahead … is refused") and the long cane's fitting is the sternum's height (APH); the refusal's text is matched only on the contract's words.
 * @evidence contracts/development/testing.md#distinguishing-cases The archetype's minimum length against the body's fitted length, the input that changes being only the cane's length; the sweep's goals are the technique units'.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_gait_cane_sweep_refusal`.
 */
export function test_motion_gait_cane_sweep_refusal(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const short: Refused = refusal(
    body,
    createLongCane({ length: createLongCane.BANDS.length.minimum }),
  );
  checks.check(
    `the shortest cane is refused on the prop as too short to reach the floor (${describe(short)})`,
    short !== undefined && short.axis === "prop" && NAMED.test(short.message),
  );
  const fitted: Refused = refusal(body, caneSweepScene.fitted(body));
  checks.check(
    `the cane fitted to the sternum is not refused (${describe(fitted)})`,
    fitted === undefined,
  );
  checks.assert("only a cane too short to reach the floor is refused");
}

/** A build's refusal, or undefined when it built. */
type Refused = HumanRefusal | undefined;

/** The refusal a two-point sweep with this cane throws, if any. */
function refusal(
  body: IAutoMovieMotionHumanBody,
  cane: caneSweepScene.Cane,
): Refused {
  try {
    caneSweepScene.sweep(body, cane, "twoPoint").bones("a", 3);
    return undefined;
  } catch (error: unknown) {
    if (error instanceof HumanRefusal) return error;
    throw error;
  }
}

/** A refusal's axis and message, or that the build was admitted. */
function describe(refused: Refused): string {
  return refused === undefined
    ? "admitted"
    : `${refused.axis}: ${refused.message}`;
}
