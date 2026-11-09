import { type IAutoMovieResolvedBone, Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePhysicalProfile as P,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";

/**
 * A posed body's colliders as signed distances: how far a point lies outside
 * the body's profile shapes (negative inside), and on which segment.
 *
 * Each profile segment's shapes are placed by its bone: the segment's neutral
 * frame is its rest frame, and the canonical rig rests unrotated, so a
 * shape's posed frame is the bone's world transform applied to the shape's
 * offset from the bone's rest joint. The signed distances are the exact ones
 * of a sphere, a capsule (a segment swept by a radius) and a box (Quilez's
 * box distance), and the body's is their minimum, the distance to the union.
 */
export namespace HumanColliders {
  /** A signed distance and the segment it is measured to. */
  export interface IDistance {
    /** Metres, negative inside. */
    distance: number;

    /** The nearest segment's bone. */
    bone: AutoMovieHumanoidBone;
  }

  /**
   * The signed distance from a point to a posed body.
   *
   * @param body The body.
   * @param bones Its posed bones, world frame.
   * @param point The point, world metres.
   * @returns The distance to the nearest collider and its bone.
   * @throws {Error} When the profile has no shape.
   */
  export function distance(body: IHumanBody, bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>, point: IAutoMovieVector3): IDistance {
    let best: IDistance | undefined;
    for (const segment of body.profile.segments) {
      const bone: AutoMovieHumanoidBone = segment.bone as AutoMovieHumanoidBone;
      const posed: IAutoMovieResolvedBone | undefined = bones.get(bone);
      const rest: IAutoMovieVector3 | undefined = body.rest.get(bone);
      if (posed === undefined || rest === undefined) continue;
      for (const shape of segment.shapes) {
        const offset: IAutoMovieVector3 = Vector3.add(
          Vector3.subtract(segment.neutral.position, rest),
          Quaternion.rotateVector(segment.neutral.rotation, shape.transform.position),
        );
        const centre: IAutoMovieVector3 = Vector3.add(posed.worldPosition, Quaternion.rotateVector(posed.worldRotation, offset));
        const rotation: IAutoMovieQuaternion = Quaternion.multiply(posed.worldRotation, Quaternion.multiply(segment.neutral.rotation, shape.transform.rotation));
        const d: number = signed(shape, centre, rotation, point);
        if (best === undefined || d < best.distance) best = { distance: d, bone };
      }
    }
    if (best === undefined) throw new Error("A body without colliders has no distance");
    return best;
  }

  /** A point's signed distance to one placed shape. */
  function signed(shape: P.IShape, centre: IAutoMovieVector3, rotation: IAutoMovieQuaternion, point: IAutoMovieVector3): number {
    const local: IAutoMovieVector3 = Quaternion.rotateVector(Quaternion.inverse(rotation), Vector3.subtract(point, centre));
    if (shape.kind === "sphere") return Vector3.length(local) - shape.radius;
    if (shape.kind === "capsule") {
      const y: number = Math.max(-shape.halfLength, Math.min(shape.halfLength, local.y));
      return Math.hypot(local.x, local.y - y, local.z) - shape.radius;
    }
    if (shape.kind === "box") {
      const q: IAutoMovieVector3 = {
        x: Math.abs(local.x) - shape.halfExtents.x,
        y: Math.abs(local.y) - shape.halfExtents.y,
        z: Math.abs(local.z) - shape.halfExtents.z,
      };
      return Math.hypot(Math.max(q.x, 0), Math.max(q.y, 0), Math.max(q.z, 0)) + Math.min(Math.max(q.x, q.y, q.z), 0);
    }
    throw new Error(`No signed distance for a ${(shape as { kind: string }).kind} collider`);
  }
}
