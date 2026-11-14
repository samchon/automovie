import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { physicalHullFaces } from "./physicalHullFaces";

/**
 * The outward unit normal of a collider at a point of its surface: a
 * sphere's radius through it, a capsule's from the nearest point of its
 * axis, and, for a box or a hull, the gradient of the smooth maximum of its
 * face planes (`SMOOTH`): the face normals weighed by how near the point
 * lies to each plane. A point inside a face keeps that face's normal; one
 * that crosses an edge turns its normal continuously from one face's to the
 * next, where a face's own normal would step by the angle between them.
 * The fallback where the radius or the axis offset has no length.
 *
 * @param frame The segment's pose.
 * @param shape The collider.
 * @param point The point of its surface, in the frame `frame` is in.
 * @param fallback The direction returned where the normal has no direction.
 * @returns The outward unit normal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each kind's normal, the edge blend and the fallback.
 * @evidence contracts/development/implementation.md#principled-implementation A sphere's and a capsule's exact gradient; a polytope's normal as the gradient of the log-sum-exp smooth maximum of its face planes' signed heights, which is continuous across edges and equals the face's normal inside it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per kind, one plane list for the box and the hull.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The weights are taken relative to the highest plane, so none overflows; a degenerate normal falls back instead of normalising a zero vector.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `physicalHullFaces` and the engine's vector and quaternion owners.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in a hull's faces, with no algorithm to choose.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
 */
export function physicalShapeNormal(
  frame: P.ITransform,
  shape: P.IShape,
  point: IAutoMovieVector3,
  fallback: IAutoMovieVector3,
): IAutoMovieVector3 {
  const centre: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, shape.transform.position),
  );
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    frame.rotation,
    shape.transform.rotation,
  );
  const radial = (from: IAutoMovieVector3): IAutoMovieVector3 => {
    const r: IAutoMovieVector3 = Vector3.subtract(point, from);
    return Vector3.length(r) > BOUNDARY ? Vector3.normalize(r) : fallback;
  };
  if (shape.kind === "sphere") return radial(centre);
  if (shape.kind === "capsule") {
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    const along: number = Math.max(
      -shape.halfLength,
      Math.min(
        shape.halfLength,
        Vector3.dot(Vector3.subtract(point, centre), axis),
      ),
    );
    return radial(Vector3.add(centre, Vector3.scale(axis, along)));
  }
  const o: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(rotation),
    Vector3.subtract(point, centre),
  );
  const planes: { normal: IAutoMovieVector3; offset: number }[] =
    shape.kind === "hull"
      ? physicalHullFaces(shape.points).faces
      : (["x", "y", "z"] as const).flatMap((k: "x" | "y" | "z") =>
          [-1, 1].map((sign: number) => ({
            normal: { x: 0, y: 0, z: 0, [k]: sign } as IAutoMovieVector3,
            offset: shape.halfExtents[k],
          })),
        );
  const heights: number[] = planes.map(
    (plane: { normal: IAutoMovieVector3; offset: number }): number =>
      Vector3.dot(plane.normal, o) - plane.offset,
  );
  const top: number = Math.max(...heights);
  let sum: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  planes.forEach(
    (plane: { normal: IAutoMovieVector3; offset: number }, k: number): void => {
      sum = Vector3.add(
        sum,
        Vector3.scale(plane.normal, Math.exp((heights[k]! - top) / SMOOTH)),
      );
    },
  );
  return Vector3.length(sum) > BOUNDARY
    ? Vector3.normalize(Quaternion.rotateVector(rotation, sum))
    : fallback;
}

/** How wide, metres, a box's or a hull's normal blends across an edge (`physicalShapeNormal`), provisional: half the 10 mm a pressed skin gives, so a face's middle keeps its own normal (a face 30 mm off weighs e^-6 of it) and an edge turns within a fingertip's breadth. */
const SMOOTH: number = 0.005;

/** Metres under which a radius or a normal has no direction. */
const BOUNDARY: number = 1e-9;
