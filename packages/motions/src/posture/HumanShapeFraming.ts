import { Quaternion, Vector3, physicalHullFaces } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanColliders,
  IAutoMoviePhysicalHullFaces,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliderBound } from "./HumanColliderBound";

/**
 * A placed collider shape's bounding sphere and, for a hull, its face
 * planes in its own frame: the bounds a clearance reading tests a point
 * against before it asks the exact distance (`HumanArmOvershoot`), and the
 * sphere a trajectory's shape list screens by (`HumanArmShapes`). Each
 * posed frame's shapes are framed once and kept while the frame lives.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is framed, for which readers and how long it is kept.
 * @evidence contracts/development/design.md#principled-representation A shape's bound is its sphere and, for a hull, its face planes in its own frame, the two tests a point is screened by before an exact query.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The framed record, the framing, the screen test and the sphere, read by the forearm's clearance and the trajectory's shapes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No shape kind is special-cased beyond the four the engine's colliders have.
 */
export namespace HumanShapeFraming {
  /**
   * A placed shape's bounding sphere and, for a hull, its face planes and
   * the frame they are read in.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit.
   * @evidence contracts/development/design.md#principled-representation The sphere every shape has and the hull's planes, frame and last deciding face, absent for other shapes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, each read by `beyond`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The planes are packed numbers in the hull's own frame, so a test reads no object.
   */
  export interface IFramed {
    /** The centre of a sphere the shape lies inside, world metres. */
    centre: IAutoMovieVector3;

    /** That sphere's radius, metres. */
    radius: number;

    /** A hull's face planes in its own frame, four numbers each: the outward unit normal and the offset along it; absent for any other shape. */
    faces?: Float64Array;

    /** The world point a hull's own frame is centred on. */
    origin?: IAutoMovieVector3;

    /** The rotation from the world into a hull's own frame. */
    inverse?: IAutoMovieQuaternion;

    /** The index into `faces` of the face that last showed a point outside, tried first: a sweep's next point mostly lies beyond the same face. */
    lead: number;
  }

  /**
   * A placed shape's bounding sphere (`sphere`) and, for a hull, its face
   * planes, the world point its frame is centred on and the rotation into
   * that frame: the same numbers every call computes for the same posed
   * frame and shape, so they are computed once per frame and shape, a swivel
   * sweep reading one trunk's colliders at every candidate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is computed and why it is kept.
   * @evidence contracts/development/implementation.md#principled-implementation The sphere and, for a hull, the face planes of the engine's hull, its centre and the rotation into its frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and, once per frame and shape, one framing.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The same numbers every call would compute, kept, never approximated.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each posed frame's shapes are framed once and read by every candidate of a sweep.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `sphere` and the engine's hull faces.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Kept in a WeakMap keyed by the posed frame and released with it.
   */
  export function of(
    pose: IAutoMovieMotionHumanColliders.IPlaced["pose"],
    shape: IAutoMovieMotionHumanColliders.IPlaced["shapes"][number],
  ): IFramed {
    let shapes:
      | Map<IAutoMovieMotionHumanColliders.IPlaced["shapes"][number], IFramed>
      | undefined = FRAMED.get(pose);
    if (shapes === undefined) {
      shapes = new Map();
      FRAMED.set(pose, shapes);
    }
    let found: IFramed | undefined = shapes.get(shape);
    if (found === undefined) {
      found = {
        ...sphere(pose, shape),
        lead: 0,
        ...(shape.kind === "hull"
          ? {
              faces: planes(shape.points),
              origin: Vector3.add(
                pose.position,
                Quaternion.rotateVector(
                  pose.rotation,
                  shape.transform.position,
                ),
              ),
              inverse: Quaternion.inverse(
                Quaternion.multiply(pose.rotation, shape.transform.rotation),
              ),
            }
          : {}),
      };
      shapes.set(shape, found);
    }
    return found;
  }

  /**
   * A hull's face planes packed four numbers each, the normal then the
   * offset, in the hull's own frame: the same for every posed frame of the
   * same hull, so packed once per hull's points and shared by every framing
   * of it (a fit frames a fresh pose's colliders, the planes do not move
   * with it).
   */
  function planes(points: readonly IAutoMovieVector3[]): Float64Array {
    const known: Float64Array | undefined = PLANES.get(points);
    if (known !== undefined) return known;
    const faces: IAutoMoviePhysicalHullFaces.IHull["faces"] = physicalHullFaces(points).faces;
    const packed: Float64Array = new Float64Array(4 * faces.length);
    faces.forEach((face: IAutoMoviePhysicalHullFaces.IFace, index: number): void => {
      packed[4 * index] = face.normal.x;
      packed[4 * index + 1] = face.normal.y;
      packed[4 * index + 2] = face.normal.z;
      packed[4 * index + 3] = face.offset;
    });
    PLANES.set(points, packed);
    return packed;
  }

  /**
   * Whether a point surely lies farther outside a shape than `bound`, by a
   * measure never more than its signed distance: its distance from the
   * shape's bounding sphere, then for a hull the greatest of its face planes'
   * distances, which is the distance itself inside and no more than it
   * outside. The face that last showed a point beyond is tried first and the
   * scan stops at the first face beyond, so the answer is the greatest's
   * without reading every face.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the measure, why it never exceeds the signed distance and the face order.
   * @evidence contracts/development/implementation.md#principled-implementation A point's distance from the bounding sphere, then the greatest of a hull's face-plane distances, each no more than the signed distance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The sphere, then the last deciding face, then the rest.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Only a point that surely lies beyond the bound is answered yes; the exact distance stays the caller's.
   * @evidence contracts/development/implementation.md#efficient-algorithms The scan stops at the first face beyond, the last deciding face tried first.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Called per point with nothing to reuse but the remembered face.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Remembers only the deciding face on the framed record it is given.
   */
  export function beyond(
    p: IAutoMovieVector3,
    shape: IFramed,
    bound: number,
  ): boolean {
    const cx: number = p.x - shape.centre.x;
    const cy: number = p.y - shape.centre.y;
    const cz: number = p.z - shape.centre.z;
    if (Math.sqrt(cx * cx + cy * cy + cz * cz) - shape.radius > bound)
      return true;
    const faces: Float64Array | undefined = shape.faces;
    if (faces === undefined) return false;
    // The point in the hull's own frame: the inverse rotation applied to its
    // offset from the frame's origin (`Quaternion.rotateVector`, unrolled).
    const q: IAutoMovieQuaternion = shape.inverse!;
    const vx: number = p.x - shape.origin!.x;
    const vy: number = p.y - shape.origin!.y;
    const vz: number = p.z - shape.origin!.z;
    const tx: number = 2 * (q.y * vz - q.z * vy);
    const ty: number = 2 * (q.z * vx - q.x * vz);
    const tz: number = 2 * (q.x * vy - q.y * vx);
    const x: number = vx + q.w * tx + (q.y * tz - q.z * ty);
    const y: number = vy + q.w * ty + (q.z * tx - q.x * tz);
    const z: number = vz + q.w * tz + (q.x * ty - q.y * tx);
    const lead: number = shape.lead;
    if (
      faces[lead]! * x +
        faces[lead + 1]! * y +
        faces[lead + 2]! * z -
        faces[lead + 3]! >
      bound
    )
      return true;
    for (let f: number = 0; f < faces.length; f += 4)
      if (
        f !== lead &&
        faces[f]! * x + faces[f + 1]! * y + faces[f + 2]! * z - faces[f + 3]! >
          bound
      ) {
        shape.lead = f;
        return true;
      }
    return false;
  }

  /**
   * A sphere a placed shape lies inside: a hull's own about the mean of its
   * vertices, a sphere itself, a capsule's about its middle reaching its
   * caps, a box's about its centre reaching its corners. A point's signed
   * distance to the shape is never less than its distance from this sphere,
   * inside the shape too, where the ray from the centre through the point
   * meets the surface within the sphere.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each shape kind's sphere and why it bounds the signed distance.
   * @evidence contracts/development/implementation.md#principled-implementation The shape's own containing sphere (`HumanColliderBound`), placed by the shape's and the segment's frames.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One local sphere and one placement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No radius is padded.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per shape, a hull's own sphere aside.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The one owner of a placed shape's bounding sphere, read by the framing, the trajectory's shapes, the body's distance screen and the digits' near colliders; the local sphere is HumanColliderBound's and every world placement is recomputed.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only a fresh world centre and scalar radius escape; no input or computed placement is retained by this function.
   */
  export function sphere(
    pose: IAutoMovieMotionHumanColliders.IPlaced["pose"],
    shape: IAutoMovieMotionHumanColliders.IPlaced["shapes"][number],
  ): { centre: IAutoMovieVector3; radius: number } {
    const local: IAutoMovieMotionHumanColliders.IBall = HumanColliderBound(shape);
    return {
      centre: Vector3.add(
        pose.position,
        Quaternion.rotateVector(
          pose.rotation,
          Vector3.add(
            shape.transform.position,
            Quaternion.rotateVector(shape.transform.rotation, local.centre),
          ),
        ),
      ),
      radius: local.radius,
    };
  }
}

/** Each hull's packed face planes in its own frame, by its points, kept while the points live (`planes`). */
const PLANES: WeakMap<readonly IAutoMovieVector3[], Float64Array> = new WeakMap();

/** Each posed segment frame's shapes as `HumanShapeFraming.of` reads them, kept while the frame lives. */
const FRAMED: WeakMap<
  IAutoMovieMotionHumanColliders.IPlaced["pose"],
  Map<IAutoMovieMotionHumanColliders.IPlaced["shapes"][number], HumanShapeFraming.IFramed>
> = new WeakMap();
