import type {
  IAutoMovieFitChainToTargetProps,
  IAutoMovieHingedArmSwivel,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { boxExcludedSwivels } from "../kinematics/boxExcludedSwivels";
import { hingedArmSwivel } from "../kinematics/hingedArmSwivel";
import { swingTwistRange } from "../kinematics/swingTwistRange";
import { prepareHingedChainAt } from "./prepareHingedChainAt";

/**
 * The swivels of one bend branch that the root joint's range certainly
 * refuses, as the fit's sweep reads them: the box and swing-twist exclusion
 * (`boxExcludedSwivels`) of the root's bone-local rotation along the swivel.
 * A caller choosing its own swivel (an arm course) intersects it with its
 * own arcs.
 *
 * @param props The fit request.
 * @param branch The bend branch, 0 or 1; clamped to the branches the target has.
 * @returns A test of whether every swivel from `low` to `high` degrees certainly overshoots the root's range; null when the chain is not a hinged two-bone chain or is degenerate.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, the certainty of the refusal and the null cases.
 * @evidence contracts/development/implementation.md#principled-implementation The root's clinical angles along the swivel are sinusoids of it (Tolani, Goswami and Badler 2000, section 3.2.4); boxExcludedSwivels certifies the intervals where they lie outside the range, with the swing-twist limit read as the fit reads it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure prepareHingedChainAt owns the preparation; this binds the fit's own exclusion to one branch's poser.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only a certainty is returned: an interval not refused may still overshoot, as in the fit.
 * @evidence contracts/development/implementation.md#efficient-algorithms One preparation; each query is boxExcludedSwivels' own closed-form interval test.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call reads its own request.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned test keeps the branch's poser and the root's clinical domain until the caller drops it.
 */
export function refusedHingedChainSwivels(
  props: IAutoMovieFitChainToTargetProps,
  branch: number,
): ((low: number, high: number) => boolean) | null {
  const at: prepareHingedChainAt.IPrepared | null = prepareHingedChainAt(props);
  if (at === null) return null;
  const stop: IAutoMovieHingedArmSwivel.IStop = at.branches[Math.min(Math.max(0, Math.round(branch)), at.branches.length - 1)]!;
  const posed: ReturnType<typeof hingedArmSwivel.pose> = hingedArmSwivel.pose(at.chain, stop.theta);
  return boxExcludedSwivels({
    basis: at.upperBasis,
    frame: props.restFrames?.[props.chain.upper],
    constraint: at.prepared.upperDomain.constraint,
    joint: swingTwistRange.of(props.chain.upper),
    rotation: (swivel: number): IAutoMovieQuaternion => posed(swivel).upper,
  });
}
