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
 * lies to each plane. Farther from edges, the closest face dominates; a
 * point that crosses an edge turns its normal continuously from one face's
 * to the next, where a face's own normal would step by their angle.
 * The fallback where the radius or the axis offset has no length.
 *
 * @param frame The segment's pose.
 * @param shape The collider.
 * @param point The point of its surface, in the frame `frame` is in.
 * @param fallback The direction returned where the normal has no direction.
 * @returns The outward unit normal.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each kind's normal, edge blend and borrowed fallback. Namespace prepare binds one unchanged admitted frame/shape, prepares only at first actual point and releases its callback with surface resolution; direct calls continue to read mutable current geometry freshly.
 * @evidence contracts/development/implementation.md#principled-implementation A sphere's and a capsule's exact gradient; a polytope's normal as the gradient of the log-sum-exp smooth maximum of its face planes' signed heights, continuous across edges and dominated by the nearest face farther from edges.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One private normal calculation serves direct calls and the prepared callback, with one branch per kind and one plane-list rule. The prepared reader only lends fixed centre/rotation, capsule axis, inverse and planes; the stateless radial helper preserves the same query threshold/fallback without a per-call closure.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The weights are taken relative to the highest plane, so none overflows; a degenerate normal falls back instead of normalising a zero vector.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work PhysicalHullFaces, quaternion/vector owners and six fixed box normals remain shared. Direct calls read current transforms/extents anew. An explicit prepare caller holds its frame/shape unchanged, allowing exact centre/rotation/axis/inverse/planes to serve actual changing points without caching a normal, fallback, height or weight.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each polytope query computes every current height and exponential in original order, scalar weighted sums and one final vector; two indexed passes omit per-query callbacks. Prepared geometry pays frame/axis/inverse/box-plane construction once and overwrites one reader-owned height workspace rather than allocating another F-element array per point. Direct calls retain no state; SurfaceRays consumes the prepared normals.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Direct temporaries release on return. A prepared callback owns one numeric frame, optional axis/inverse, O(F) planes and one O(F) height workspace until its operation ends. Every present plane height is overwritten at each point; no point, fallback, normal result or query population is retained. Only six unit normals live for the module; outputs remain fresh except the original borrowed fallback.
 */
export function physicalShapeNormal(
  frame: P.ITransform,
  shape: P.IShape,
  point: IAutoMovieVector3,
  fallback: IAutoMovieVector3,
): IAutoMovieVector3 {
  return normal(frame, shape, point, fallback);
}

/**
 * Fixed collider geometry can lend only its invariant normal prerequisites.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The prepared reader keeps frame/shape unchanged, accepts current points/fallbacks and retains the original borrowed degenerate fallback.
 * @evidence contracts/development/design.md#principled-representation The same sphere/capsule gradient or smoothed polytope normal is read in the parent frame; only centre, rotation, axis, inverse and planes are invariant.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanoidSurfaceRays uses prepare for repeated normals on each unchanged rest collider, without exporting a mutable preparation record or another geometric representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No caller-derived frame, result flag, target point or cached normal enters the API; every current point and plane weight remains evaluated by the same private owner.
 */
export namespace physicalShapeNormal {
  /**
   * Read normals on one unchanged admitted frame/shape during an operation.
   * The first actual point lazily prepares its composed frame and the kind's
   * axis/inverse/planes. Every later point retains original radial checks,
   * plane heights, exponential weights, summation order and normalization.
   * Release the callback after surface resolution; geometry edits require
   * another reader. It owns O(F) fixed planes and overwritten height scratch
   * for F faces; every current height is computed, without a normal cache.
   */
  export function prepare(
    frame: P.ITransform,
    shape: P.IShape,
  ): (point: IAutoMovieVector3, fallback: IAutoMovieVector3) => IAutoMovieVector3 {
    const prepared: IPrepared = {};
    return (point: IAutoMovieVector3, fallback: IAutoMovieVector3): IAutoMovieVector3 =>
      normal(frame, shape, point, fallback, prepared);
  }
}

/** One fixed box face's unit normal and the half-extent axis that gives its offset. */
interface IBoxPlane {
  /** The face's outward unit normal in box-local coordinates. */
  normal: IAutoMovieVector3;

  /** Which current half extent supplies the plane's offset, metres. */
  axis: "x" | "y" | "z";
}

/** Canonical face order: negative then positive X, Y and Z, as in the original plane construction. */
const BOX: readonly IBoxPlane[] = [
  { axis: "x", normal: { x: -1, y: 0, z: 0 } },
  { axis: "x", normal: { x: 1, y: 0, z: 0 } },
  { axis: "y", normal: { x: 0, y: -1, z: 0 } },
  { axis: "y", normal: { x: 0, y: 1, z: 0 } },
  { axis: "z", normal: { x: 0, y: 0, z: -1 } },
  { axis: "z", normal: { x: 0, y: 0, z: 1 } },
];

/** How wide, metres, a box's or a hull's normal blends across an edge (`physicalShapeNormal`), provisional: half the 10 mm a pressed skin gives, so a face's middle keeps its own normal (a face 30 mm off weighs e^-6 of it) and an edge turns within a fingertip's breadth. */
const SMOOTH: number = 0.005;

/** Metres under which a radius or a normal has no direction. */
const BOUNDARY: number = 1e-9;

/** Fixed metadata and overwritten scalar scratch; no query point or output is retained. */
interface IPrepared {
  /** Actual parent/local centre and principal rotation, prepared on first normal demand. */
  frame?: { centre: IAutoMovieVector3; rotation: IAutoMovieQuaternion };

  /** Capsule length direction in the query's common frame. */
  axis?: IAutoMovieVector3;

  /** Common-to-polytope rotation, unused by radial primitives. */
  inverse?: IAutoMovieQuaternion;

  /** Hull owner planes or six original-order box planes. */
  planes?: readonly { normal: IAutoMovieVector3; offset: number }[];

  /** Every present plane's height is overwritten before this query's maximum/weights. */
  heights?: number[];
}

/** The same current-point normal equations serve direct and fixed-geometry readers. */
function normal(
  frame: P.ITransform,
  shape: P.IShape,
  point: IAutoMovieVector3,
  fallback: IAutoMovieVector3,
  prepared?: IPrepared,
): IAutoMovieVector3 {
  const centre: IAutoMovieVector3 = prepared?.frame?.centre ?? Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, shape.transform.position),
  );
  const rotation: IAutoMovieQuaternion = prepared?.frame?.rotation ?? Quaternion.multiply(
    frame.rotation,
    shape.transform.rotation,
  );
  if (prepared !== undefined && prepared.frame === undefined)
    prepared.frame = { centre, rotation };
  if (shape.kind === "sphere") return radial(point, centre, fallback);
  if (shape.kind === "capsule") {
    const axis: IAutoMovieVector3 = prepared?.axis ?? Quaternion.rotateVector(rotation, {
      x: 0,
      y: 1,
      z: 0,
    });
    if (prepared !== undefined && prepared.axis === undefined) prepared.axis = axis;
    const along: number = Math.max(
      -shape.halfLength,
      Math.min(
        shape.halfLength,
        Vector3.dot(Vector3.subtract(point, centre), axis),
      ),
    );
    return radial(point, Vector3.add(centre, Vector3.scale(axis, along)), fallback);
  }
  const inverse: IAutoMovieQuaternion = prepared?.inverse ?? Quaternion.inverse(rotation);
  if (prepared !== undefined && prepared.inverse === undefined) prepared.inverse = inverse;
  const o: IAutoMovieVector3 = Quaternion.rotateVector(
    inverse,
    Vector3.subtract(point, centre),
  );
  const planes: readonly { normal: IAutoMovieVector3; offset: number }[] =
    prepared?.planes ?? (shape.kind === "hull"
      ? physicalHullFaces(shape.points).faces
      : BOX.map(
          (
            plane: IBoxPlane,
          ): { normal: IAutoMovieVector3; offset: number } => ({
            normal: plane.normal,
            offset: shape.halfExtents[plane.axis],
          }),
        ));
  if (prepared !== undefined && prepared.planes === undefined) prepared.planes = planes;
  const heights: number[] = prepared === undefined ? [] : (prepared.heights ??= []);
  heights.length = planes.length;
  for (let k: number = 0; k < planes.length; k++) {
    if (!(k in planes)) continue;
    const plane: { normal: IAutoMovieVector3; offset: number } = planes[k]!;
    heights[k] = Vector3.dot(plane.normal, o) - plane.offset;
  }
  const top: number = Math.max(...heights);
  let x: number = 0;
  let y: number = 0;
  let z: number = 0;
  for (let k: number = 0; k < planes.length; k++) {
    if (!(k in planes)) continue;
    const plane: { normal: IAutoMovieVector3; offset: number } = planes[k]!;
    const weight: number = Math.exp((heights[k]! - top) / SMOOTH);
    x += plane.normal.x * weight;
    y += plane.normal.y * weight;
    z += plane.normal.z * weight;
  }
  const sum: IAutoMovieVector3 = { x, y, z };
  return Vector3.length(sum) > BOUNDARY
    ? Vector3.normalize(Quaternion.rotateVector(rotation, sum))
    : fallback;
}

/** Preserve the exact radial threshold and borrowed fallback without a per-query closure. */
function radial(point: IAutoMovieVector3, from: IAutoMovieVector3, fallback: IAutoMovieVector3): IAutoMovieVector3 {
  const r: IAutoMovieVector3 = Vector3.subtract(point, from);
  return Vector3.length(r) > BOUNDARY ? Vector3.normalize(r) : fallback;
}

