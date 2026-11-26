import type {
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalShapeNearest,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { physicalShapeNearest } from "../physicalShapeNearest";
import { physicalShapePairDistance } from "../physicalShapePairDistance";
import { physicalShapePenetration } from "./physicalShapePenetration";

/**
 * The contact between two convex colliders: their signed distance, the unit
 * normal from the first toward the second and each one's surface witness.
 *
 * Two convex solids come nearest on a vertex or an edge of one of them, or on
 * the axis of a round one (Ericson, "Real-Time Collision Detection", 2005, ch.
 * 5 and 9), so the contact is the least, over both shapes' wire frames
 * (`physicalShapePairDistance.wires`), of the wire's signed distance to the
 * other solid (`physicalShapeNearest`) less the wire's radius. The witness on
 * the other solid is its nearest surface point; the witness on the wire's own
 * shape lies one radius from the wire toward it. Overlapping, a wire whose core
 * lies inside the other solid bounds the depth only from below, so the depth,
 * direction and witnesses are the Expanding Polytope Algorithm's
 * (`physicalShapePenetration`); a round wire whose core stays outside keeps the
 * exact core distance less its radius.
 *
 * @param poseA The first shape's parent pose, world metres.
 * @param shapeA The first shape.
 * @param poseB The second shape's parent pose, world metres.
 * @param shapeB The second shape.
 * @returns The contact, world metres.
 */
export function physicalShapePairContact(
  poseA: IAutoMovieRigidTransform,
  shapeA: IAutoMoviePhysicalShape,
  poseB: IAutoMovieRigidTransform,
  shapeB: IAutoMoviePhysicalShape,
): physicalShapePairContact.IResult {
  let best: physicalShapePairContact.IResult | null = null;
  let core: number = Infinity;
  for (const [pose, shape, otherPose, other, first] of [
    [poseA, shapeA, poseB, shapeB, true],
    [poseB, shapeB, poseA, shapeA, false],
  ] as const) {
    const centre: IAutoMovieVector3 = Vector3.add(
      pose.position,
      Quaternion.rotateVector(pose.rotation, shape.transform.position),
    );
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      pose.rotation,
      shape.transform.rotation,
    );
    const frame: physicalShapePairDistance.IWires =
      physicalShapePairDistance.wires(shape);
    for (const [a, b] of frame.segments) {
      const from: IAutoMovieVector3 = Vector3.add(
        centre,
        Quaternion.rotateVector(rotation, a),
      );
      const to: IAutoMovieVector3 =
        a === b
          ? from
          : Vector3.add(centre, Quaternion.rotateVector(rotation, b));
      const near: IAutoMoviePhysicalShapeNearest.IResult = physicalShapeNearest(
        otherPose,
        other,
        from,
        to,
      );
      const distance: number = near.distance - frame.radius;
      if (best !== null && distance >= best.distance) continue;

      // The other shape's outward normal points at this wire's shape.
      const own: IAutoMovieVector3 = Vector3.subtract(
        near.at,
        Vector3.scale(near.normal, frame.radius),
      );
      core = near.distance;
      best = first
        ? {
            distance,
            normal: Vector3.scale(near.normal, -1),
            pointA: own,
            pointB: near.point,
          }
        : { distance, normal: near.normal, pointA: near.point, pointB: own };
    }
  }

  // A wire inside the other solid gives only a lower bound on the depth:
  // the depth is then the Minkowski difference's, by EPA.
  if (core <= 0) {
    const deep: physicalShapePenetration.IResult | null =
      physicalShapePenetration(poseA, shapeA, poseB, shapeB);
    if (deep !== null)
      return {
        distance: -deep.depth,
        normal: deep.normal,
        pointA: deep.pointA,
        pointB: deep.pointB,
      };
  }
  return best!;
}

/** Companion types of {@link physicalShapePairContact}. */
export namespace physicalShapePairContact {
  /** A contact between two convex colliders, world metres. */
  export interface IResult {
    /** Signed distance, metres; negative when they overlap. */
    distance: number;

    /** Unit normal from the first shape toward the second. */
    normal: IAutoMovieVector3;

    /** The first shape's witness. */
    pointA: IAutoMovieVector3;

    /** The second shape's witness. */
    pointB: IAutoMovieVector3;
  }
}
