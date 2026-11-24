import type { IAutoMovieMotionHumanBody } from "@automovie/interface";
import { HumanRefusal } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { crutchStairsScene } from "../../internal/crutchStairsScene";

/**
 * The single-leg step-up's riser limit as a share of the hip height, the stair
 * climb's own bound the original cites.
 */
const LIMIT: number = 0.35;

/**
 * How far either side of the limit the two risers lie, as a share of the hip
 * height: one hundredth, the original's 0.36.
 */
const STEP: number = 0.01;

/**
 * A riser too high for a single-leg step-up is refused, and one just under the
 * limit is not: the refusal case of `test_motion_gait_crutch_stairs` with its
 * adjacent valid case, on the average man as the original, going up (the climb
 * is one action).
 *
 * Scenarios:
 *
 * 1. A riser of 0.36 of the hip height is refused on the `riser` axis, the
 *    original's check.
 * 2. A riser of 0.34 of the hip height, just under the stair climb's 0.35 limit,
 *    builds without a refusal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original's refusal, the adjacent case, the entry and the body.
 * @evidence contracts/development/testing.md#behavioral-verification Builds both climbs through `HumanPerformance` and reads the refusal's axis or its absence; an admitted high riser, a refusal on another axis, or a refused riser under the limit fails.
 * @evidence contracts/development/testing.md#independent-expectations The limit is the stair climb's single-leg step-up bound, 0.35 of the hip height, which the original cites; the two risers lie a hundredth either side of it.
 * @evidence contracts/development/testing.md#distinguishing-cases Two risers either side of the limit, the input that changes being only the riser; the climbs' goals are the direction units'.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_gait_crutch_stairs_refusal`.
 */
export function test_motion_gait_crutch_stairs_refusal(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const high: Refused = refusal(body, (LIMIT + STEP) * body.measure.hipHeight);
  checks.check(
    `a riser above 0.35 of the hip height is refused on the riser (${describe(high)})`,
    high !== undefined && high.axis === "riser",
  );
  const under: Refused = refusal(body, (LIMIT - STEP) * body.measure.hipHeight);
  checks.check(
    `a riser just under 0.35 of the hip height is not refused (${describe(under)})`,
    under === undefined,
  );
  checks.assert("only a riser above the single-leg step-up is refused");
}

/** A build's refusal, or undefined when it built. */
type Refused = HumanRefusal | undefined;

/** The refusal a climb up over this riser throws, if any. */
function refusal(body: IAutoMovieMotionHumanBody, riser: number): Refused {
  try {
    crutchStairsScene.climb(body, { riser }).film.bones("a", 1);
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
