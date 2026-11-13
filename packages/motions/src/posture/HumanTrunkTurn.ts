import { getConstraint } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "./IHumanPosture";

/**
 * A trunk turned toward one side by a share of its own range, with the head
 * righted against it: the spine and the chest each bend to that side and
 * twist toward it by the same share of their own range toward that side,
 * and the neck and the head take back what those two turned, half each,
 * within their own ranges, so the head stays upright and facing as it was
 * (the head-righting reflex keeps the head vertical as the trunk tilts).
 *
 * The spine's side bend is about its +Z, negative to the performer's left,
 * and its twist about +Y turns the chest to the left (`HUMANOID_JOINT_AXES`);
 * the neck and the head share those axes. A share is the fraction of the way
 * from each joint's present angle to the end of its range toward the side; a
 * negative share turns the trunk the other way by that fraction of the way
 * to the other ends. A joint the rig leaves without a freedom keeps it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what turns, by how much, the axes, the sign of the side and of the share, and what a missing freedom does.
 * @evidence contracts/development/design.md#principled-representation One share of each joint's own range, so no angle is named and every body turns within its own limits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function; a law that needs its trunk to follow a limb solves the share.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No law and no body is named.
 */
export namespace HumanTrunkTurn {
  /**
   * The posture with its trunk turned toward a side by a share of its range.
   *
   * @param body The body, for its joints' ranges.
   * @param posture The posture.
   * @param share The share of the way to the range's ends, from -1 to 1; positive toward `side`.
   * @param side The side the trunk turns toward at a positive share.
   * @returns The posture with the spine, the chest, the neck and the head set; every other part unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, their units and what is set.
   * @evidence contracts/development/implementation.md#principled-implementation Each freedom moves the share of the way to its own range's end toward the side, so the turn never leaves the range; the head's take-back is clamped to the neck's and the head's ranges.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two loops: the trunk turns, the head rights.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A joint without a range in a freedom is left as it is in it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work: four joints.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function with nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new posture and retains nothing.
   */
  export function turned(
    body: IHumanBody,
    posture: IHumanPosture,
    share: number,
    side: "left" | "right",
  ): IHumanPosture {
    const toLeft: number = side === "left" ? 1 : -1;
    const joints: IHumanPosture["joints"] = { ...posture.joints };
    let roll: number = 0;
    let twist: number = 0;
    for (const bone of ["spine", "chest"] as const) {
      const was: readonly [number, number, number] = joints[bone] ?? [0, 0, 0];
      const limits: ReturnType<typeof getConstraint> = range(body, bone);
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
      const limits: ReturnType<typeof getConstraint> = range(body, bone);
      joints[bone] = [
        was[0],
        within(was[1] - roll / 2, was[1], limits?.abduction),
        within(was[2] - twist / 2, was[2], limits?.twist),
      ];
    }
    return { ...posture, joints };
  }
}

/** One freedom's range, or none. */
type Limits = NonNullable<ReturnType<typeof getConstraint>>["twist"];

/** A joint's range on this body's rig. */
function range(
  body: IHumanBody,
  bone: AutoMovieHumanoidBone,
): ReturnType<typeof getConstraint> {
  return getConstraint(
    bone,
    body.skeleton.bones.find((b: IAutoMovieBone): boolean => b.bone === bone)
      ?.constraint ?? null,
  );
}

/** An angle moved a share of the way to its range's end on the side `sign * share` points to. */
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

/** An angle clamped to its range; the present angle where there is none. */
function within(
  value: number,
  was: number,
  limits: Limits | undefined,
): number {
  return limits === null || limits === undefined
    ? was
    : Math.min(limits.max, Math.max(limits.min, value));
}
