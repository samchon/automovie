import { AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { readHumanBone } from "../../body/internal/readHumanBone";

/*
 * A trunk turned toward one side by a share of its own range, with the head
 * righted against it: the spine and the chest each bend to that side and twist
 * toward it by the same share of their own range toward that side, and the neck
 * and the head take back what those two turned, half each, within their own
 * ranges, so the head stays upright and facing as it was (the head-righting
 * reflex keeps the head vertical as the trunk tilts).
 *
 * The spine's side bend is about its +Z, negative to the performer's left, and
 * its twist about +Y turns the chest to the left (`HUMANOID_JOINT_AXES`); the
 * neck and the head share those axes. A share is the fraction of the way from
 * each joint's present angle to the end of its range toward the side; a
 * negative share turns the trunk the other way by that fraction of the way to
 * the other ends. A joint the rig leaves without a freedom keeps it.
 */
export namespace HumanTrunkTurn {
  /*
   * The posture with its trunk turned toward a side by a share of its range.
   * Parameter body: The body, for its joints' ranges.
   * Parameter posture: The posture.
   * Parameter share: The share of the way to the range's ends, from -1 to 1;
   * positive toward `side`.
   * Parameter side: The side the trunk turns toward at a positive share.
   * Returns: The posture with the spine, the chest, the neck and the head set;
   * every other part unchanged.
   */
  export function turned(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    share: number,
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanPosture {
    const toLeft: number = side === "left" ? 1 : -1;
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };
    let roll: number = 0;
    let twist: number = 0;
    for (const bone of ["spine", "chest"] as const) {
      const was: readonly [number, number, number] = joints[bone] ?? [0, 0, 0];
      const limits: ReturnType<typeof AutoMovieEngineKinematics.getConstraint> = range(body, bone);
      const next: [number, number, number] = [
        was[0],
        toward(was[1], limits?.abduction, -toLeft, share),
        toward(was[2], limits?.twist, toLeft, share),
      ];
      roll += next[1] - was[1];
      twist += next[2] - was[2];
      joints[bone] = next;
    }
    for (const bone of ["neck", "head"] as const) {
      const was: readonly [number, number, number] = joints[bone] ?? [0, 0, 0];
      const limits: ReturnType<typeof AutoMovieEngineKinematics.getConstraint> = range(body, bone);
      joints[bone] = [
        was[0],
        within(was[1] - roll / 2, was[1], limits?.abduction),
        within(was[2] - twist / 2, was[2], limits?.twist),
      ];
    }
    return { ...posture, joints };
  }
}

/*
 * One freedom's range, or none.
 */
type Limits = NonNullable<ReturnType<typeof AutoMovieEngineKinematics.getConstraint>>["twist"];

/*
 * A joint's range on this body's rig.
 */
function range(
  body: IAutoMovieMotionHumanBody,
  bone: AutoMovieHumanoidBone,
): ReturnType<typeof AutoMovieEngineKinematics.getConstraint> {
  return AutoMovieEngineKinematics.getConstraint(bone, readHumanBone(body, bone)?.constraint ?? null);
}

/*
 * An angle moved a share of the way to its range's end on the side `sign *
 * share` points to.
 */
function toward(
  was: number,
  limits: Limits | undefined,
  sign: number,
  share: number,
): number {
  return limits === null || limits === undefined
    ? was
    : was +
        Math.abs(share) * ((sign * share > 0 ? limits.max : limits.min) - was);
}

/*
 * An angle clamped to its range; the present angle where there is none.
 */
function within(
  value: number,
  was: number,
  limits: Limits | undefined,
): number {
  return limits === null || limits === undefined
    ? was
    : Math.min(limits.max, Math.max(limits.min, value));
}
