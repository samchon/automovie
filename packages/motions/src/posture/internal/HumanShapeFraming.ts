import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanColliders,
  IAutoMoviePhysicalHullFaces,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliderBound } from "./HumanColliderBound";

/*
 * A placed shape's bounding sphere (`sphere`) and, for a hull, its face planes,
 * the world point its frame is centred on and the rotation into that frame. A
 * sweep frames its colliders once, when it prepares its room
 * (`HumanArmOvershootRoom.of`), and reads them at every candidate.
 */
export function HumanShapeFraming(
  pose: IAutoMovieMotionHumanColliders.IPlaced["pose"],
  shape: IAutoMovieMotionHumanColliders.IPlaced["shapes"][number],
): HumanShapeFraming.IFramed {
  return {
    ...HumanShapeFraming.sphere(pose, shape),
    lead: 0,
    ...(shape.kind === "hull"
      ? {
          faces: planes(shape),
          origin: AutoMovieEngineVector3.add(
            pose.position,
            AutoMovieEngineQuaternion.rotateVector(pose.rotation, shape.transform.position),
          ),
          inverse: AutoMovieEngineQuaternion.inverse(
            AutoMovieEngineQuaternion.multiply(pose.rotation, shape.transform.rotation),
          ),
        }
      : {}),
  };
}

/*
 * A placed collider shape's bounding sphere and, for a hull, its face planes in
 * its own frame: the bounds a clearance reading tests a point against before it
 * asks the exact distance (`HumanArmOvershoot`), and the sphere a trajectory's
 * shape list screens by (`HumanArmShapes`).
 */
export namespace HumanShapeFraming {
  /*
   * A placed shape's bounding sphere and, for a hull, its face planes and the
   * frame they are read in.
   */
  export interface IFramed {
    /*
     * The centre of a sphere the shape lies inside, world metres.
     */
    centre: IAutoMovieVector3;

    /*
     * That sphere's radius, metres.
     */
    radius: number;

    /*
     * A hull's face planes in its own frame, four numbers each: the outward
     * unit normal and the offset along it; absent for any other shape.
     */
    faces?: Float64Array;

    /*
     * The world point a hull's own frame is centred on.
     */
    origin?: IAutoMovieVector3;

    /*
     * The rotation from the world into a hull's own frame.
     */
    inverse?: IAutoMovieQuaternion;

    /*
     * The index into `faces` of the face that last showed a point outside,
     * tried first: a sweep's next point mostly lies beyond the same face.
     */
    lead: number;
  }

  /*
   * Whether a point surely lies farther outside a shape than `bound`, by a
   * measure never more than its signed distance: its distance from the shape's
   * bounding sphere, then for a hull the greatest of its face planes'
   * distances, which is the distance itself inside and no more than it outside.
   * The face that last showed a point beyond is tried first and the scan stops
   * at the first face beyond, so the answer is the greatest's without reading
   * every face.
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
    // offset from the frame's origin (`AutoMovieEngineQuaternion.rotateVector`, unrolled).
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

  /*
   * A sphere a placed shape lies inside: a hull's own about the mean of its
   * vertices, a sphere itself, a capsule's about its middle reaching its caps,
   * a box's about its centre reaching its corners. A point's signed distance to
   * the shape is never less than its distance from this sphere, inside the
   * shape too, where the ray from the centre through the point meets the
   * surface within the sphere.
   */
  export function sphere(
    pose: IAutoMovieMotionHumanColliders.IPlaced["pose"],
    shape: IAutoMovieMotionHumanColliders.IPlaced["shapes"][number],
  ): ISphereResult {
    const local: IAutoMovieMotionHumanColliders.IBall =
      HumanColliderBound(shape);
    return {
      centre: AutoMovieEngineVector3.add(
        pose.position,
        AutoMovieEngineQuaternion.rotateVector(
          pose.rotation,
          AutoMovieEngineVector3.add(
            shape.transform.position,
            AutoMovieEngineQuaternion.rotateVector(shape.transform.rotation, local.centre),
          ),
        ),
      ),
      radius: local.radius,
    };
  }
}

/*
 * A hull's face planes packed four numbers each, the normal then the offset, in
 * the hull's own frame: the same for every posed frame of the same hull (a fit
 * frames a fresh pose's colliders, the planes do not move with it).
 */
function planes(
  shape: Extract<IAutoMoviePhysicalShape, { kind: "hull" }>,
): Float64Array {
  const faces: IAutoMoviePhysicalHullFaces.IHull["faces"] =
    AutoMovieEnginePhysics.physicalShapeHull(shape).faces;
  const packed: Float64Array = new Float64Array(4 * faces.length);
  faces.forEach(
    (face: IAutoMoviePhysicalHullFaces.IFace, index: number): void => {
      packed[4 * index] = face.normal.x;
      packed[4 * index + 1] = face.normal.y;
      packed[4 * index + 2] = face.normal.z;
      packed[4 * index + 3] = face.offset;
    },
  );
  return packed;
}

/*
 * The record of `ISphereResult`'s site.
 */
type ISphereResult = { centre: IAutoMovieVector3; radius: number };
