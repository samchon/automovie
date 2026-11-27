import {
  AutoMovieHumanoidBone,
  IAutoMovieSkeleton,
  IAutoMovieTransform,
} from "@automovie/interface";

import { skeletonRestFrames } from "./skeletonRestFrames";

/*
 * A skeleton's rest-pose joint span in metres: the model-Y distance between its
 * lowest and highest joint once every bone's rest transform is composed down
 * the parent chain.
 *
 * This is the span between the extreme joints, which is not the subject's
 * height. A rig ends at the joints it needs for animation, and geometry
 * continues past them at both ends: the generated `stickman` puts its highest
 * joint at 0.92 of the declared height and its lowest at 0.24, so this returns
 * 0.680 of the real figure, and framing solved from it crops an actor's head.
 * computeModelRestExtentY measures supplied portable parts or their
 * proxy; the framing passes read this only when a node's model measured
 * nothing.
 *
 * Returns 0 for a skeleton with no bones, and throws, through
 * skeletonRestFrames, when a bone is duplicated, a parent is missing, or
 * the parent links cycle.
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
