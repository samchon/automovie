import type {
  IAutoMoviePhysicalHullFaces,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { closestPointsBetweenSegments } from "../math/internal/closestPointsBetweenSegments";
import { physicalHullEdges } from "./internal/physicalHullEdges";
import { physicalShapeBounds } from "./physicalShapeBounds";
import { physicalShapeHull } from "./physicalShapeHull";
import { physicalShapeNearest } from "./physicalShapeNearest";

/**
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
 *
 * @param poseA The first shape's parent pose, world metres.
 * @param shapeA The first shape.
 * @param poseB The second shape's parent pose, world metres.
 * @param shapeB The second shape.
 * @returns Metres, negative when the shapes overlap.
 */
export function physicalShapePairDistance(
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
    const centre: IAutoMovieVector3 = Vector3.add(
      pose.position,
      Quaternion.rotateVector(pose.rotation, shape.transform.position),
    );
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      pose.rotation,
      shape.transform.rotation,
    );
    const world = (p: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(centre, Quaternion.rotateVector(rotation, p));
    const frame: physicalShapePairDistance.IWires =
      physicalShapePairDistance.wires(shape);

    // The other shape lies inside the sphere about its bounds, so a wire is
    // no nearer it than the wire is to that sphere, inside the shape or out:
    // a wire that far cannot lower the least found so far and is not queried.
    const bounds: ReturnType<typeof physicalShapeBounds> = physicalShapeBounds(
      otherPose,
      other,
    );
    const middle: IAutoMovieVector3 = Vector3.scale(
      Vector3.add(bounds.min, bounds.max),
      0.5,
    );
    const around: number = Vector3.distance(middle, bounds.max);
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

/** Companion types and the wire frames of {@link physicalShapePairDistance}. */
export namespace physicalShapePairDistance {
  /** A shape's wire frame in its own frame: segments widened by a radius. */
  export interface IWires {
    /** The segments, shape-local metres; a point is a segment of no length. */
    segments: readonly (readonly [IAutoMovieVector3, IAutoMovieVector3])[];

    /** The radius the segments are widened by, metres. */
    radius: number;
  }

  /**
   * The wire frame of one shape: a sphere's centre and a capsule's axis widened
   * by their radius, a box's and a hull's edges widened by nothing. A hull's
   * edges are kept per point list.
   *
   * @param shape The shape.
   * @returns Its wire frame, shape-local metres.
   */
  export function wires(shape: IAutoMoviePhysicalShape): IWires {
    return frameOf(shape);
  }
}

/** The wire frame of one shape. */
const frameOf = (
  shape: IAutoMoviePhysicalShape,
): physicalShapePairDistance.IWires => {
  if (shape.kind === "sphere")
    return {
      segments: [
        [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 0, z: 0 },
        ],
      ],
      radius: shape.radius,
    };
  if (shape.kind === "capsule")
    return {
      segments: [
        [
          { x: 0, y: -shape.halfLength, z: 0 },
          { x: 0, y: shape.halfLength, z: 0 },
        ],
      ],
      radius: shape.radius,
    };
  if (shape.kind === "box") {
    const h: IAutoMovieVector3 = shape.halfExtents;
    const segments: [IAutoMovieVector3, IAutoMovieVector3][] = [];
    for (const u of [-1, 1])
      for (const v of [-1, 1])
        segments.push(
          [
            { x: -h.x, y: u * h.y, z: v * h.z },
            { x: h.x, y: u * h.y, z: v * h.z },
          ],
          [
            { x: u * h.x, y: -h.y, z: v * h.z },
            { x: u * h.x, y: h.y, z: v * h.z },
          ],
          [
            { x: u * h.x, y: v * h.y, z: -h.z },
            { x: u * h.x, y: v * h.y, z: h.z },
          ],
        );
    return { segments, radius: 0 };
  }
  if (shape.kind === "hull") {
    const hull: IAutoMoviePhysicalHullFaces.IHull = physicalShapeHull(shape);
    return { segments: hull.edges ?? physicalHullEdges(hull), radius: 0 };
  }
  shape satisfies never;
  throw new Error("Unknown physical shape kind");
};
