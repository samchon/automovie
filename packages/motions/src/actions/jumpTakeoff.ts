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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the planted-foot rule, the exact tie and that leading is relative to the body before its world placement.
 * @evidence contracts/development/implementation.md#principled-implementation Forward kinematics of the entered displayed joints with a null root reads the two ankles before translation or heading. Rigid placement changes only the root transform, so the same joint pose gives the same leading foot without subtracting large world coordinates or undoing a rounded world rotation. This defines leading along the body's +Z, independently of the destination; jumpPush owns the turn toward that destination.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Return the sole planted foot, otherwise pose the entered joints once and compare their local ankle coordinates.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the actual displayed articulation and uses an exact comparison; no epsilon, cache quantization or replacement rest pose enters the choice.
 * @evidence contracts/development/implementation.md#efficient-algorithms Only double support requests FK. Ordinary complete joint admission remains, while hierarchy evaluation visits only the two ankles' ancestor closure; no unrelated upper-body transform map is produced and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses poseBones, the canonical forward-kinematics owner; no limb inverse fit is solved again.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
