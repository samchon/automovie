import type {
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
} from "@automovie/interface";

import { AutoMovieEngineJointRomScan } from "../../rom/internal/AutoMovieEngineJointRomScan";
import type { swingTwistRange } from "../swingTwistRange";

/**
 * The total range-of-motion overshoot of one joint's clinical angles, in
 * degrees, or `0` when the joint is within its constraint.
 *
 * It sums the overshoot of every fault {@link AutoMovieEngineJointRomScan.scanJointRom} reports, the measure
 * the pose gate's `validateJointRom` words into its violations, so a solver
 * that ranks candidates by this number cannot judge itself by a kinder rule
 * than the gate, and a ranking over hundreds of candidates builds no message
 * for any of them. A non-finite angle is reported without an overshoot and
 * scores `Infinity`, so it never wins a ranking. A `null` constraint scores
 * `0`.
 *
 * @param joint Clinical angles of one joint; `null` axes are at rest.
 * @param constraint The joint's resolved ROM, or `null` when unconstrained.
 * @param rig The bone's frame as the caller's rig resolves it, for a joint
 *   gated by swing and twist; the humanoid tables' when absent.
 */
export function jointRomOvershoot(
  joint: IAutoMovieJointPose,
  constraint: IAutoMovieJointConstraint | null,
  rig?: swingTwistRange.IPrepared,
): number {
  return constraint === null
    ? 0
    : AutoMovieEngineJointRomScan.scanJointRomOvershoot(joint, constraint, rig);
}
