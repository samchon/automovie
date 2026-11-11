import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  closestPointsBetweenSegments,
  physicalHullFaces,
  physicalShapeBounds,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";

/**
 * A posed body's colliders as signed distances: how far a point, or a
 * segment (a capsule weapon's axis), lies outside the body's profile shapes
 * (negative inside), and on which segment.
 *
 * Each profile segment's shapes are placed by its bone: the segment's neutral
 * frame is its rest frame, and the canonical rig rests unrotated, so a
 * segment's posed frame is the bone's world transform applied to the
 * segment's neutral offset from the bone's rest joint. Every shape distance
 * is the engine's single owner, `physicalShapeSegmentDistance`, and the
 * body's distance is the least over its shapes, the distance to their union.
 * A shape whose bounding sphere already lies farther than the least distance
 * found is passed over without the exact query, which cannot change the
 * least, so the searches that call this in loops pay for the near shapes only.
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
  export function distance(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    point: IAutoMovieVector3,
  ): IDistance {
    return distanceToSegment(body, bones, point, point);
  }

  /**
   * The signed distance from a segment to a posed body: the least over the
   * segment's points of their signed distance to the body's colliders. A
   * zero-length segment is a point.
   *
   * @param body The body.
   * @param bones Its posed bones, world frame.
   * @param a One end, world metres.
   * @param b The other end, world metres.
   * @returns The distance to the nearest collider and its bone.
   * @throws {Error} When the profile has no shape.
   */
  export function distanceToSegment(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): IDistance {
    let best: IDistance | undefined;
    for (const { bone, pose, shapes } of placed(body, bones))
      for (const shape of shapes) {
        // A shape lies inside its bounding sphere, so it is no nearer than
        // the sphere: one that cannot beat the least found is skipped.
        if (best !== undefined) {
          const ball: IBall = bound(shape);
          const centre: IAutoMovieVector3 = Vector3.add(
            pose.position,
            Quaternion.rotateVector(
              pose.rotation,
              Vector3.add(
                shape.transform.position,
                Quaternion.rotateVector(shape.transform.rotation, ball.centre),
              ),
            ),
          );
          if (
            closestPointsBetweenSegments(a, b, centre, centre).distance -
              ball.radius >=
            best.distance
          )
            continue;
        }
        const d: number = physicalShapeSegmentDistance(pose, shape, a, b);
        if (best === undefined || d < best.distance)
          best = { distance: d, bone };
      }
    if (best === undefined)
      throw new Error("A body without colliders has no distance");
    return best;
  }

  /**
   * The lowest world height any of a posed body's colliders reaches, metres:
   * the least over the placed shapes of their exact world axis bounds
   * (`physicalShapeBounds`). This is what a body lying or falling rests on, and
   * it is synchronous, unlike the engine's physics geometry, which needs the
   * physics runtime initialised.
   *
   * @param body The body.
   * @param bones Its posed bones, world frame.
   * @returns The least world Y of every collider, metres.
   * @throws {Error} When the profile has no shape.
   */
  export function lowest(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): number {
    let low: number = Infinity;
    for (const { pose, shapes } of placed(body, bones))
      for (const shape of shapes)
        low = Math.min(low, physicalShapeBounds(pose, shape).min.y);
    if (low === Infinity)
      throw new Error("A body without colliders has no lowest point");
    return low;
  }

  /** One profile segment placed by its posed bone: the parent pose its shapes compose with. */
  export interface IPlaced {
    /** The rig bone that carries the segment. */
    bone: AutoMovieHumanoidBone;

    /** The segment's posed frame, world metres: the bone's world transform applied to the segment's neutral offset from the bone's rest joint. */
    pose: P.ITransform;

    /** The segment's shapes, each placed by `pose` composed with its own transform. */
    shapes: readonly P.IShape[];
  }

  /**
   * Every profile segment of a posed body with the frame its shapes are placed
   * in. The canonical rig rests unrotated and a segment's neutral frame is its
   * rest frame, so the posed frame is the bone's world rotation applied to the
   * neutral offset from the bone's rest joint. This is the single owner of
   * collider placement; distances and bounds read it.
   *
   * @param body The body.
   * @param bones Its posed bones, world frame.
   * @returns The placed segments, in profile order; a segment whose bone the pose does not carry is skipped.
   */
  export function placed(
    body: IHumanBody,
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IPlaced[] {
    // Profile segments name rig bones by string; reading the posed map by name
    // and taking the bone from the posed entry avoids casting the string.
    const byName: ReadonlyMap<string, IAutoMovieResolvedBone> = bones;
    const out: IPlaced[] = [];
    for (const segment of body.profile.segments) {
      const posed: IAutoMovieResolvedBone | undefined = byName.get(
        segment.bone,
      );
      if (posed === undefined) continue;
      const rest: IAutoMovieVector3 | undefined = body.rest.get(posed.bone);
      if (rest === undefined) continue;
      out.push({
        bone: posed.bone,
        pose: {
          position: Vector3.add(
            posed.worldPosition,
            Quaternion.rotateVector(
              posed.worldRotation,
              Vector3.subtract(segment.neutral.position, rest),
            ),
          ),
          rotation: Quaternion.multiply(
            posed.worldRotation,
            segment.neutral.rotation,
          ),
        },
        shapes: segment.shapes,
      });
    }
    return out;
  }
}

/** A sphere containing a shape, in the shape's own frame. */
interface IBall {
  /** The sphere's centre, shape-local metres. */
  centre: IAutoMovieVector3;

  /** The sphere's radius, metres. */
  radius: number;
}

/** The sphere about a shape's centre that contains it: a sphere's own radius, a capsule's half length plus radius, a box's half diagonal, a hull's vertex radius about its vertex mean. */
const bound = (shape: P.IShape): IBall => {
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  if (shape.kind === "sphere") return { centre: origin, radius: shape.radius };
  if (shape.kind === "capsule")
    return { centre: origin, radius: shape.halfLength + shape.radius };
  if (shape.kind === "box")
    return { centre: origin, radius: Vector3.length(shape.halfExtents) };
  if (shape.kind === "hull") {
    const hull: physicalHullFaces.IHull = physicalHullFaces(shape.points);
    return { centre: hull.centre, radius: hull.radius };
  }
  shape satisfies never;
  throw new Error("Unknown physical shape kind");
};
