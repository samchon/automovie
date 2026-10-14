import {
  AutoMovieHumanoidBone,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";

import { skeletonRestFrames } from "./skeletonRestFrames";

/**
 * A skeleton's rest-pose joint span in metres: the model-Y distance between its lowest and highest joint once every bone's rest transform is composed down the parent chain.
 *
 * This is the span between the extreme joints, which is not the subject's height. A rig ends at the joints it needs for animation, and geometry continues past them at both ends: the generated `stickman` puts its highest joint at 0.92 of the declared height and its lowest at 0.24, so this returns 0.680 of the real figure, and framing solved from it crops an actor's head. {@link computeModelRestExtentY} measures supplied portable parts or their proxy; the framing passes read this only when a node's model measured nothing.
 *
 * Returns 0 for a skeleton with no bones, and throws, through {@link skeletonRestFrames}, when a bone is duplicated, a parent is missing, or the parent links cycle.
 *
 * @evidence contracts/common.md#principled-implementation Reads each joint's model-space Y from the shared rest-frame forward kinematics and returns max minus min; rest scale is unit by the rig contract, so the composed translations are the joint positions the renderer poses.
 * @evidence contracts/common.md#clear-and-simple-design A one-axis reduction over `skeletonRestFrames`, which owns the composition and the malformed-rig refusals that `computeModelRestExtent` shares, so the two rest measurements cannot disagree about where a bone sits.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no rig; the empty skeleton's 0 is the measured span of nothing, and the subject-height substitution for it belongs to `nodeSubjectExtent`, not here.
 * @evidence contracts/common.md#meaningful-documentation States the unit and axis, why a joint span understates a drawn figure with the stickman ratio, which function to use for framing, the empty-rig result, and each throwing case.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the bone count B: one rest-frame walk of O(B) and one pass over the bones for the extremes.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure measurement of one skeleton that coordinates nothing across calls; a caller framing one rig repeatedly owns any reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing past the call; the rest-frame map it builds is dropped on return and only a number leaves.
 */
export function computeRestHeight(skeleton: IAutoMovieSkeleton): number {
  if (skeleton.bones.length === 0) return 0;
  const frames: ReadonlyMap<
    AutoMovieHumanoidBone,
    Pick<IAutoMovieTransform, "translation" | "rotation">
  > = skeletonRestFrames(skeleton);
  let min: number = Infinity;
  let max: number = -Infinity;
  for (const frame of frames.values()) {
    const y: number = frame.translation.y;
    if (y < min) min = y;
    if (y > max) max = y;
  }
  return max - min;
}
