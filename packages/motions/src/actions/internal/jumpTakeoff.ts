import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { HumanBoneGroups } from "../../posture/internal/HumanBoneGroups";
import { poseBones } from "../../posture/internal/poseBones";

/*
 * Choose the planted foot leading in the body's own frame for a jump, keeping
 * the left foot on an exact tie in double support.
 * Parameter body: The body whose entered joint pose is read.
 * Parameter entry: The displayed joint pose and planted feet; the caller has
 * admitted at least one planted foot.
 * Returns: The only planted foot, or the ankle further along root-local +Z in
 * double support.
 */
export function jumpTakeoff(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanEntryState,
): AutoMovieHumanSide {
  const planted: AutoMovieHumanSide[] = (["left", "right"] as const).filter(
    (side: AutoMovieHumanSide): boolean => entry.feet[side].planted,
  );
  if (planted.length === 1) return planted[0]!;
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    { ...entry.pose, root: null },
    undefined,
    HumanBoneGroups.FEET,
  );
  return bones.get("leftFoot")!.worldPosition.z >=
    bones.get("rightFoot")!.worldPosition.z
    ? "left"
    : "right";
}
