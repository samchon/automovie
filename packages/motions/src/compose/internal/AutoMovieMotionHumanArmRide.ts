import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
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

import type { HumanArmTrajectory } from "../../posture/internal/HumanArmTrajectory";
import { HumanColliders } from "../../posture/internal/HumanColliders";
import { poseBones } from "../../posture/internal/poseBones";

/*
 * A planned arm's site that rides another arm of the same plan
 * (`HumanArmTrajectory.ISite.on`), read off where the base and the lead arm's
 * own site put it: a grip on an object both hands hold, in the lead hand's
 * frame, or a touch on a segment of the other arm, in that segment's frame.
 */
export namespace AutoMovieMotionHumanArmRide {
  /*
   * A grip on an object both hands hold, in the lead hand's frame as the lead's
   * site puts it: the grip's point and the hand's rotation relative to the lead
   * hand at its own site, and no surface normal, so the contact is held to the
   * point on every axis (a closed chain, the second hand's pose the object's
   * times its grasp offset).
   * Parameter lead: The lead hand's site, with its rotation.
   * Parameter own: The gripping hand's site.
   * Returns: The ride, without the lead arm's index.
   */
  export function gripped(
    lead: HumanArmTrajectory.ISite,
    own: HumanArmTrajectory.ISite,
  ): Omit<NonNullable<HumanArmTrajectory.ISite["on"]>, "arm"> {
    const turn: IAutoMovieQuaternion = lead.rotation!;
    const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(turn);
    const wrist: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      lead.point,
      AutoMovieEngineQuaternion.rotateVector(turn, lead.contact),
    );
    return {
      owner: "hand",
      point: AutoMovieEngineQuaternion.rotateVector(
        inverse,
        AutoMovieEngineVector3.subtract(own.point, wrist),
      ),
      ...(own.rotation === undefined
        ? {}
        : { rotation: AutoMovieEngineQuaternion.multiply(inverse, own.rotation) }),
    };
  }

  /*
   * A site on a segment of another arm of the group, in that segment's own
   * frame where the base holds it: the point, the touched collider's outward
   * normal there and the hand's rotation.
   * Parameter body: The body.
   * Parameter pose: The base pose the segment is read on.
   * Parameter side: The other arm.
   * Parameter bone: The bone of the segment touched.
   * Parameter point: The site's world point.
   * Parameter rotation: The hand's world rotation on the site; free when absent.
   * Returns: The ride, without the other arm's index.
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
    const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(by.worldRotation);
    const segment: IAutoMovieMotionHumanColliders.IPlaced | undefined =
      HumanColliders.placed(body, bones).find(
        (s: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
          s.bone === by.bone,
      );
    let normal: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
      AutoMovieEngineVector3.subtract(point, by.worldPosition),
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
      point: AutoMovieEngineQuaternion.rotateVector(
        inverse,
        AutoMovieEngineVector3.subtract(point, by.worldPosition),
      ),
      normal: AutoMovieEngineQuaternion.rotateVector(inverse, normal),
      ...(rotation === undefined
        ? {}
        : { rotation: AutoMovieEngineQuaternion.multiply(inverse, rotation) }),
    };
  }
}

/*
 * The alternatives of `RidingOwner`'s site.
 */
type RidingOwner = "upper" | "lower" | "hand";
