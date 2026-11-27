import {
  Quaternion,
  Vector3,
  AutoMovieEnginePhysics,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanArmTrajectory } from "../posture/HumanArmTrajectory";
import { HumanColliders } from "../posture/HumanColliders";
import { poseBones } from "../posture/internal/poseBones";

/** The alternatives of `RidingOwner`'s site. */
type RidingOwner = "upper" | "lower" | "hand";

/**
 * A planned arm's site that rides another arm of the same plan
 * (`HumanArmTrajectory.ISite.on`), read off where the base and the lead arm's
 * own site put it: a grip on an object both hands hold, in the lead hand's
 * frame, or a touch on a segment of the other arm, in that segment's frame.
 */
export namespace AutoMovieMotionHumanArmRide {
  /**
   * A grip on an object both hands hold, in the lead hand's frame as the lead's
   * site puts it: the grip's point and the hand's rotation relative to the lead
   * hand at its own site, and no surface normal, so the contact is held to the
   * point on every axis (a closed chain, the second hand's pose the object's
   * times its grasp offset).
   *
   * @param lead The lead hand's site, with its rotation.
   * @param own The gripping hand's site.
   * @returns The ride, without the lead arm's index.
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
   * frame where the base holds it: the point, the touched collider's outward
   * normal there and the hand's rotation.
   *
   * @param body The body.
   * @param pose The base pose the segment is read on.
   * @param side The other arm.
   * @param bone The bone of the segment touched.
   * @param point The site's world point.
   * @param rotation The hand's world rotation on the site; free when absent.
   * @returns The ride, without the other arm's index.
   */
  export function riding(
    body: IAutoMovieMotionHumanBody,
    pose: IAutoMoviePose,
    side: AutoMovieHumanSide,
    bone: AutoMovieHumanoidBone,
    point: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion | undefined,
  ): Omit<NonNullable<HumanArmTrajectory.ISite["on"]>, "arm"> {
    const owner: RidingOwner = bone.endsWith("UpperArm")
      ? "upper"
      : bone.endsWith("LowerArm")
        ? "lower"
        : "hand";
    const carried: AutoMovieHumanoidBone = `${side}${owner === "upper" ? "UpperArm" : owner === "lower" ? "LowerArm" : "Hand"}`;
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      pose,
      undefined,
      new Set([carried]),
    );
    const by: IAutoMovieResolvedBone = bones.get(carried)!;
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
      const d: number = AutoMovieEnginePhysics.physicalShapeSegmentDistance(
        segment!.pose,
        shape,
        point,
        point,
      );
      if (d < least) {
        least = d;
        normal = AutoMovieEnginePhysics.physicalShapeNormal(segment!.pose, shape, point, normal);
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
