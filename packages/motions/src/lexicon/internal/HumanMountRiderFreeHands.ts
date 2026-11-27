import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import type { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import type { HumanMountRider } from "./HumanMountRider";

/** The alternatives of `FreeHandsArm`'s site. */
type FreeHandsArm = "leftArm" | "rightArm";

/**
 * The wrists as the posture shows them, before either grip is assigned: an arm
 * the posture already places, such as a hand resting on a thigh, starts from
 * there. A hand whose arm goal the posture gives in the world, turned, is where
 * that goal puts it, the wrist on its point turned to its rotation, the arm
 * fit's own closed-form answer, so no read fits that arm again; the others are
 * read off the posture resolved without those arms.
 */
export function HumanMountRiderFreeHands(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  requested: ReadonlySet<AutoMovieHumanoidBone>,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  projection?: ReturnType<typeof prepareHumanPostureProjection>,
): ReadonlyMap<AutoMovieHumanoidBone, HumanMountRider.IFree> {
  const out: Map<AutoMovieHumanoidBone, HumanMountRider.IFree> = new Map();
  const rest: Set<AutoMovieHumanoidBone> = new Set();
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
  for (const bone of requested) {
    const arm: FreeHandsArm = bone.startsWith("left") ? "leftArm" : "rightArm";
    const goal: IAutoMovieHumanLimbGoal | undefined = posture.limbs[arm];
    if (
      goal !== undefined &&
      goal.on === undefined &&
      goal.rotation !== undefined
    ) {
      out.set(bone, {
        position: goal.point,
        rotation: goal.rotation,
        pole: goal.bend,
      });
      delete limbs[arm];
    } else rest.add(bone);
  }
  if (rest.size === 0) return out;
  // The elbows the same fit places, read with their wrists: each is an ancestor of its wrist, so the fit computes it anyway.
  const read = prepareHumanPoseResolution(resolution);
  const elbows: Set<AutoMovieHumanoidBone> = new Set(rest);
  for (const bone of rest)
    elbows.add(bone.startsWith("left") ? "leftLowerArm" : "rightLowerArm");
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(
      body,
      resolveHumanPosture.seeded(
        body,
        { ...posture, limbs },
        undefined,
        undefined,
        read,
        rest,
        projection,
      ).pose,
      read(),
      elbows,
    );
  for (const bone of rest) {
    const found: IAutoMovieResolvedBone = bones.get(bone)!;
    const elbow: IAutoMovieResolvedBone | undefined = bones.get(
      bone.startsWith("left") ? "leftLowerArm" : "rightLowerArm",
    );
    out.set(bone, {
      position: found.worldPosition,
      rotation: found.worldRotation,
      ...(elbow === undefined ? {} : { pole: elbow.worldPosition }),
    });
  }
  return out;
}
