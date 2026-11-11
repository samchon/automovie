import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { physicalHullFaces } from "./physicalHullFaces";
import { physicalShapeNearest } from "./physicalShapeNearest";

/**
 * The signed distance between two admitted shapes, each placed by its parent
 * pose: positive when they are apart, negative when one enters the other.
 *
 * Every shape is a wire frame widened by a radius: a sphere is its centre and
 * a capsule its axis, widened by their radius; a box and a hull are their
 * edges, widened by nothing. The distance is the least, over both shapes, of
 * the signed distance from one shape's wires to the other shape
 * (`physicalShapeNearest`) less the wires' radius.
 *
 * Apart, this is the exact distance between the two solids: the nearest pair
 * of points of two convex solids lies on a vertex or an edge of one of them,
 * or on the axis of a round one. Overlapping, it is how deep a wire of one
 * lies inside the other, the same depth a capsule's axis reads against a
 * body, so two capsules read their axis distance less both radii.
 *
 * @param poseA The first shape's parent pose, world metres.
 * @param shapeA The first shape.
 * @param poseB The second shape's parent pose, world metres.
 * @param shapeB The second shape.
 * @returns Metres, negative when the shapes overlap.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the wire frame of each kind, why the reading is exact apart and what it measures when the shapes overlap.
 * @evidence contracts/development/implementation.md#principled-implementation The nearest features of two disjoint convex polytopes are a vertex and a face or two edges (Ericson, Real-Time Collision Detection, 2005, ch. 5 and 9), each of which contains a point of an edge of one polytope, so the least edge-to-solid distance over both is the distance; a round shape is its axis offset by its radius.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One wire frame per shape kind with an exhaustive check, and one loop each way over the single proximity owner; no second distance formula exists here.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance, sample count or margin is added; every wire is queried exactly by the owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms One proximity query per wire of each shape: one for a round shape, twelve for a box, the edge count for a hull, a few dozen for a body module.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A hull's edges are read from the faces `physicalHullFaces` already shares per point list and kept beside them per point list.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The edge lists live in a weak map keyed by the point list, so they go when the shape goes.
 */
export function physicalShapePairDistance(
  poseA: P.ITransform,
  shapeA: P.IShape,
  poseB: P.ITransform,
  shapeB: P.IShape,
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
    const frame: IWires = wires(shape);
    for (const [a, b] of frame.segments)
      least = Math.min(
        least,
        physicalShapeNearest(otherPose, other, world(a), world(b)).distance -
          frame.radius,
      );
  }
  return least;
}

/** A shape's wire frame in its own frame: segments widened by a radius. */
interface IWires {
  /** The segments, shape-local metres; a point is a segment of no length. */
  segments: readonly (readonly [IAutoMovieVector3, IAutoMovieVector3])[];

  /** The radius the segments are widened by, metres. */
  radius: number;
}

/** The wire frame of one shape. */
const wires = (shape: P.IShape): IWires => {
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
    const known: IWires | undefined = EDGES.get(shape.points);
    if (known !== undefined) return known;
    const hull: physicalHullFaces.IHull = physicalHullFaces(shape.points);
    const index: Map<IAutoMovieVector3, number> = new Map();
    const seen: Set<string> = new Set();
    const segments: [IAutoMovieVector3, IAutoMovieVector3][] = [];
    for (const face of hull.faces)
      face.loop.forEach((from: IAutoMovieVector3, at: number): void => {
        const to: IAutoMovieVector3 = face.loop[(at + 1) % face.loop.length]!;
        for (const p of [from, to]) if (!index.has(p)) index.set(p, index.size);
        const i: number = index.get(from)!;
        const j: number = index.get(to)!;
        const key: string = i < j ? `${i}:${j}` : `${j}:${i}`;
        if (seen.has(key)) return;
        seen.add(key);
        segments.push([from, to]);
      });
    const found: IWires = { segments, radius: 0 };
    EDGES.set(shape.points, found);
    return found;
  }
  shape satisfies never;
  throw new Error("Unknown physical shape kind");
};

/** Each hull's edges by its point list. */
const EDGES: WeakMap<readonly IAutoMovieVector3[], IWires> = new WeakMap();
