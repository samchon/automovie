import { IAutoMovieContinuityTolerances } from "./IAutoMovieContinuityTolerances";
import { ViolationCollector } from "./ViolationCollector";

/** Default world-space position drift tolerated across a cut (metres). */
const DEFAULT_POSITION_TOLERANCE: number = 0.05;

/** Default facing drift tolerated across a cut (degrees). */
const DEFAULT_FACING_TOLERANCE_DEG: number = 5;

/**
 * Default position/facing tolerance to0.05m/5deg and admit finite nonnegative values, with facing<=180.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Default position/facing tolerance to0.05m/5deg and admit finite nonnegative values, with facing<=180.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One shared owner validates tolerance before either pairwise or film comparison.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Explicit bad values append errors and return null, rather than being silently replaced.
 * @evidence contracts/development/common.md#meaningful-documentation Defaults, units, inclusive boundaries and null refusal are documented.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two scalar checks plus a small record/fault allocation take constant work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Both continuity entrypoints reuse this exact tolerance policy once per call.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only the tolerance record or caller-owned faults escape; no snapshot state is retained.
 */
export const readContinuityTolerances: (
  position: number | undefined,
  facingDeg: number | undefined,
  root: string,
  collector: ViolationCollector,
) => IAutoMovieContinuityTolerances | null = (
  position: number | undefined,
  facingDeg: number | undefined,
  root: string,
  collector: ViolationCollector,
): IAutoMovieContinuityTolerances | null => {
  const pos: number = position ?? DEFAULT_POSITION_TOLERANCE;
  const facing: number = facingDeg ?? DEFAULT_FACING_TOLERANCE_DEG;
  const badPos: boolean = !Number.isFinite(pos) || pos < 0;
  const badFacing: boolean =
    !Number.isFinite(facing) || facing < 0 || facing > 180;
  if (badPos)
    collector.push(
      "range",
      `${root}.positionTolerance`,
      "a finite position tolerance >= 0 metres",
      position,
    );
  if (badFacing)
    collector.push(
      "range",
      `${root}.facingToleranceDeg`,
      "a finite facing tolerance in [0, 180] degrees",
      facingDeg,
    );
  if (badPos || badFacing) return null;
  return { position: pos, facingDeg: facing };
};
