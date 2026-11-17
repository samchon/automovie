import type { IAutoMovieChainBone } from "./IAutoMovieChainBone";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/** Resolved rest-chain input for a free-swing two-bone IK solve; callers own finite coordinates and unit frame rotations. */
export namespace IAutoMovieTwoBoneChainArticulation {
  /**
 * The bone-local articulation of a resolved two-segment chain that lands its
 * end effector on `target`: the leg plant's solve.
 *
 * Segment lengths and rest directions are measured from the chain's resolved
 * world positions. The upper segment is lifted off the root-to-target axis by
 * {@link solveTwoBoneIK}'s `lift`, turning about the bend-plane normal: the
 * caller's `bendNormal` when given, otherwise `axis × world-down` so the mid
 * joint is displaced toward world-down, or `axis × +Z` when the axis is
 * vertical. The root's world change is lowered to bone-local as
 * `restWorld⁻¹ · Δ · restWorld`, and the mid joint aims the fore segment's
 * bone-local direction at the target. An unreachable target extends or folds
 * the chain toward it, so the effector stops on the reachable shell.
 *
 * The mid rotation is a free swing, so it may carry abduction and twist; a
 * caller whose mid joint is a hinge passes the hinge axis as `bendNormal` to
 * keep the solve in its plane. The arm reach uses
 * {@link hingedArmArticulation} instead, which turns the elbow about its hinge
 * by construction. Which bones form the chain and how the deltas become
 * clinical angles stay with the caller.
 *
 * Returns `null` for a degenerate chain: a segment shorter than `1e-6`, or a
 * target within `1e-6` of the root.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains resolved world rest geometry, target shell behavior and the explicit bend-normal fallback.
 * @evidence contracts/development/design.md#principled-representation Lengths and positions use metres, frame rotations are unit, and the world bend normal is normalized. The solver returns null for links or target distance below 1e-6 metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface twoBoneChainArticulation derives bone-local root and mid articulations; callers own clinical decomposition and range admission.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The geometric solver exposes no named action or bone pair and does not claim a free-swing mid joint satisfies hinge ROM.
 */
  export type IProps = {
    /** Chain root's resolved rest position in world metres and rest world orientation. */
    upper: IAutoMovieChainBone;
    /** Mid joint in the same resolved world frame; its distance from upper is the first link length. */
    lower: IAutoMovieChainBone;
    /** Rest effector world position in metres; its distance from lower is the second link length. */
    end: IAutoMovieVector3;
    /** Desired effector world position in metres; unreachable distances use the geometric shell rather than throwing. */
    target: IAutoMovieVector3;
    /** World-space bend-plane normal, normalized by the solver. Omission uses reach-axis cross world-down; a supplied or derived vector shorter than 1e-6 falls back to reach-axis cross +Z. */
    bendNormal?: IAutoMovieVector3 | undefined;
  };
}
