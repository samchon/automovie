import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";

/**
 * Choose the planted foot leading in the body's own frame for a jump,
 * keeping the left foot on an exact tie in double support.
 *
 * @param body The body whose entered joint pose is read.
 * @param entry The displayed joint pose and planted feet; the caller has admitted at least one planted foot.
 * @returns The only planted foot, or the ankle further along root-local +Z in double support.
 */
export function jumpTakeoff(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanEntryState,
): "left" | "right" {
  const planted: ("left" | "right")[] = (["left", "right"] as const).filter(
    (side: "left" | "right"): boolean => entry.feet[side].planted,
  );
  if (planted.length === 1) return planted[0]!;
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    { ...entry.pose, root: null },
    undefined,
    FEET,
  );
  return bones.get("leftFoot")!.worldPosition.z >=
    bones.get("rightFoot")!.worldPosition.z
    ? "left"
    : "right";
}

/** Leading-foot selection consumes only the two achieved ankle positions. */
const FEET: ReadonlySet<AutoMovieHumanoidBone> = new Set(["leftFoot", "rightFoot"]);
