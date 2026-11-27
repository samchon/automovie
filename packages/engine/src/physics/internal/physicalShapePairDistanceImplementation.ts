import type { IAutoMoviePhysicalShape, IAutoMovieQuaternion, IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";
import type { AutoMovieEnginePhysicsPairDistanceTypes } from "../AutoMovieEnginePhysicsPairDistanceTypes";

import { AutoMovieEngineQuaternion } from "../../math/AutoMovieEngineQuaternion";
import { AutoMovieEngineVector3 } from "../../math/AutoMovieEngineVector3";
import { closestPointsBetweenSegments } from "../../math/internal/closestPointsBetweenSegments";
import "../internal/physicalHullEdges";
import { physicalShapeBoundsImplementation } from "./physicalShapeBoundsImplementation";
import "./physicalShapeHull";
import { physicalShapeNearest } from "../internal/physicalShapeNearest";
import { PhysicalShapePairDistanceImplementationData } from "./PhysicalShapePairDistanceImplementationData";

/*
 * Internal implementations shared by the one-function entry modules.
 */
/*
 * Internal typed runtime implementations shared by the query entry modules.
 */
export const physicalShapePairDistanceImplementation: {
  physicalShapePairDistance: typeof physicalShapePairDistance;
  physicalShapePairDistanceWires: typeof physicalShapePairDistanceWires;
} = {
  physicalShapePairDistance,
  physicalShapePairDistanceWires,
};


/*
 * The signed distance between two admitted shapes, each placed by its parent
 * pose: positive when they are apart, negative when one enters the other.
 *
 * Every shape is a wire frame widened by a radius: a sphere is its centre and a
 * capsule its axis, widened by their radius; a box and a hull are their edges,
 * widened by nothing. The distance is the least, over both shapes, of the
 * signed distance from one shape's wires to the other shape
 * (`physicalShapeNearest`) less the wires' radius.
 *
 * Apart, this is the exact distance between the two solids: the nearest pair of
 * points of two convex solids lies on a vertex or an edge of one of them, or on
 * the axis of a round one. Overlapping, it is how deep a wire of one lies
 * inside the other, the same depth a capsule's axis reads against a body, so
 * two capsules read their axis distance less both radii.
 * Parameter poseA: The first shape's parent pose, world metres.
 * Parameter shapeA: The first shape.
 * Parameter poseB: The second shape's parent pose, world metres.
 * Parameter shapeB: The second shape.
 * Returns: Metres, negative when the shapes overlap.
 */
function physicalShapePairDistance(
  poseA: IAutoMovieRigidTransform,
  shapeA: IAutoMoviePhysicalShape,
  poseB: IAutoMovieRigidTransform,
  shapeB: IAutoMoviePhysicalShape,
): number {
  let least: number = Infinity;
  for (const [pose, shape, otherPose, other] of [
    [poseA, shapeA, poseB, shapeB],
    [poseB, shapeB, poseA, shapeA],
  ] as const) {
    const centre: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      pose.position,
      AutoMovieEngineQuaternion.rotateVector(pose.rotation, shape.transform.position),
    );
    const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      pose.rotation,
      shape.transform.rotation,
    );
    const world = (p: IAutoMovieVector3): IAutoMovieVector3 =>
      AutoMovieEngineVector3.add(centre, AutoMovieEngineQuaternion.rotateVector(rotation, p));
    const frame: AutoMovieEnginePhysicsPairDistanceTypes.IWires =
      physicalShapePairDistanceWires(shape);

    // The other shape lies inside the sphere about its bounds, so a wire is
    // no nearer it than the wire is to that sphere, inside the shape or out:
    // a wire that far cannot lower the least found so far and is not queried.
    const bounds: ReturnType<typeof physicalShapeBoundsImplementation.physicalShapeBounds> = physicalShapeBoundsImplementation.physicalShapeBounds(
      otherPose,
      other,
    );
    const middle: IAutoMovieVector3 = AutoMovieEngineVector3.scale(
      AutoMovieEngineVector3.add(bounds.min, bounds.max),
      0.5,
    );
    const around: number = AutoMovieEngineVector3.distance(middle, bounds.max);
    for (const [a, b] of frame.segments) {
      const from: IAutoMovieVector3 = world(a);
      const to: IAutoMovieVector3 = a === b ? from : world(b);
      if (
        closestPointsBetweenSegments(from, to, middle, middle).distance -
          around -
          frame.radius >=
        least
      )
        continue;
      least = Math.min(
        least,
        physicalShapeNearest(otherPose, other, from, to).distance -
          frame.radius,
      );
    }
  }
  return least;
}


/*
 * The wire frame of one shape: a sphere's centre and a capsule's axis widened
 * by their radius, a box's and a hull's edges widened by nothing. A hull's
 * edges are kept per point list.
 * Parameter shape: The shape.
 * Returns: Its wire frame, shape-local metres.
 */
function physicalShapePairDistanceWires(
  shape: IAutoMoviePhysicalShape,
): AutoMovieEnginePhysicsPairDistanceTypes.IWires {
  return PhysicalShapePairDistanceImplementationData.frameOf(shape);
}
