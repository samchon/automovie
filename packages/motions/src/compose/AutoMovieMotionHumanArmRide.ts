import {
  Quaternion,
  Vector3,
  physicalShapeNormal,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanHand,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanArmTrajectory } from "../posture/HumanArmTrajectory";
import { HumanColliders } from "../posture/HumanColliders";
import { poseBones } from "../posture/poseBones";

/**
 * A planned arm's site that rides another arm of the same plan
 * (`HumanArmTrajectory.ISite.on`), read off where the base and the lead
 * arm's own site put it: a grip on an object both hands hold, in the lead
 * hand's frame, or a touch on a segment of the other arm, in that segment's
 * frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a riding site is and the two frames it is read in.
 * @evidence contracts/development/design.md#principled-representation A site on a moving segment is held in that segment's own frame, so the plan carries it as the segment is solved.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two readings, both read by `AutoMovieMotionHumanArmPlanned.planned`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The riding frame is the segment's or the lead site's, never the hand as posed when it is read.
 */
export namespace AutoMovieMotionHumanArmRide {
  /**
   * A grip on an object both hands hold, in the lead hand's frame as the
   * lead's site puts it: the grip's point and the hand's rotation relative
   * to the lead hand at its own site, and no surface normal, so the contact
   * is held to the point on every axis (a closed chain, the second hand's
   * pose the object's times its grasp offset).
   *
   * @param lead The lead hand's site, with its rotation.
   * @param own The gripping hand's site.
   * @returns The ride, without the lead arm's index.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, the members and why no normal is given.
   * @evidence contracts/development/implementation.md#principled-implementation A closed chain through a held object: the second grip is the first's pose times the grasp's relative offset.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One inverse rotation, one wrist point, two relative readings.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The lead's planned site, not the lead hand as posed.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function gripped(
    lead: HumanArmTrajectory.ISite,
    own: HumanArmTrajectory.ISite,
  ): Omit<NonNullable<HumanArmTrajectory.ISite["on"]>, "arm"> {
    const turn: IAutoMovieQuaternion = lead.rotation!;
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(turn);
    const wrist: IAutoMovieVector3 = Vector3.subtract(
      lead.point,
      Quaternion.rotateVector(turn, lead.contact),
    );
    return {
      owner: "hand",
      point: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(own.point, wrist),
      ),
      ...(own.rotation === undefined
        ? {}
        : { rotation: Quaternion.multiply(inverse, own.rotation) }),
    };
  }

  /**
   * A site on a segment of another arm of the group, in that segment's own
   * frame where the base holds it: the point, the touched collider's
   * outward normal there and the hand's rotation.
   *
   * @param body The body.
   * @param pose The base pose the segment is read on.
   * @param side The other arm.
   * @param bone The bone of the segment touched.
   * @param point The site's world point.
   * @param rotation The hand's world rotation on the site; free when absent.
   * @returns The ride, without the other arm's index.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame and each member.
   * @evidence contracts/development/implementation.md#principled-implementation A point on a rigid segment is constant in the segment's frame; its normal is the nearest collider shape's.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The segment's bone, its colliders' nearest shape, three readings in its frame.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The normal is the touched collider's, not the direction from the bone.
   * @evidence contracts/development/implementation.md#efficient-algorithms One pose of the bones and one scan of the segment's shapes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `poseBones`, `HumanColliders.placed`, `physicalShapeSegmentDistance` and `physicalShapeNormal`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function riding(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    side: IAutoMovieMotionHumanHand.Side,
    bone: AutoMovieHumanoidBone,
    point: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion | undefined,
  ): Omit<NonNullable<HumanArmTrajectory.ISite["on"]>, "arm"> {
    const owner: "upper" | "lower" | "hand" = bone.endsWith("UpperArm")
      ? "upper"
      : bone.endsWith("LowerArm")
        ? "lower"
        : "hand";
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      pose,
    );
    const by: IAutoMovieResolvedBone = bones.get(
      `${side}${owner === "upper" ? "UpperArm" : owner === "lower" ? "LowerArm" : "Hand"}`,
    )!;
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(by.worldRotation);
    const segment: IAutoMovieMotionHumanColliders.IPlaced | undefined =
      HumanColliders.placed(body, bones).find(
        (s: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
          s.bone === by.bone,
      );
    let normal: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(point, by.worldPosition),
    );
    let least: number = Infinity;
    for (const shape of segment?.shapes ?? []) {
      const d: number = physicalShapeSegmentDistance(
        segment!.pose,
        shape,
        point,
        point,
      );
      if (d < least) {
        least = d;
        normal = physicalShapeNormal(segment!.pose, shape, point, normal);
      }
    }
    return {
      owner,
      point: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(point, by.worldPosition),
      ),
      normal: Quaternion.rotateVector(inverse, normal),
      ...(rotation === undefined
        ? {}
        : { rotation: Quaternion.multiply(inverse, rotation) }),
    };
  }
}
