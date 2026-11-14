import type {
  AutoMovieHumanoidBone,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { physicalHullFaces } from "../physics/physicalHullFaces";
import { physicalShapeBounds } from "../physics/physicalShapeBounds";
import { physicalShapeNormal } from "../physics/physicalShapeNormal";
import type { AutoMovieHumanoidSurfaceRegions } from "./AutoMovieHumanoidSurfaceRegions";
import type { IAutoMovieResolvedBone } from "./IAutoMovieResolvedBone";
import type { resolveAutoMovieHumanoidSurfaces } from "./resolveAutoMovieHumanoidSurfaces";
import { resolvePose } from "./resolvePose";

/**
 * The rest-pose readers a humanoid's surfaces are resolved with
 * (`resolveAutoMovieHumanoidSurfaces`): its bones, segments, collider
 * bounds, bone-local frames, stations, and the exits of rays from them
 * through the colliders with the colliders' outward normal there.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the readers and their reader.
 * @evidence contracts/development/design.md#principled-representation Exact ray exits through convex colliders and the exited collider's outward normal (`physicalShapeNormal`).
 * @evidence contracts/development/design.md#minimal-and-owned-surface One reader bundle and the exit record.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A missing bone, segment or hit throws rather than inventing a point.
 */
export namespace AutoMovieHumanoidSurfaceRays {
  /** The farthest distance along a unit ray at which it is still inside a shape, or -Infinity on a miss. */
  function shapeExit(
    frame: P.ITransform,
    shape: P.IShape,
    origin: IAutoMovieVector3,
    d: IAutoMovieVector3,
  ): number {
    const centre: IAutoMovieVector3 = Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, shape.transform.position),
    );
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      frame.rotation,
      shape.transform.rotation,
    );
    const sphere = (c: IAutoMovieVector3, r: number): number => {
      const oc: IAutoMovieVector3 = Vector3.subtract(origin, c);
      const b: number = Vector3.dot(oc, d);
      const disc: number = b * b - (Vector3.dot(oc, oc) - r * r);
      return disc < -BOUNDARY * r
        ? -Infinity
        : -b + Math.sqrt(Math.max(0, disc));
    };
    if (shape.kind === "sphere") return sphere(centre, shape.radius);
    if (shape.kind === "capsule") {
      const axis: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
        x: 0,
        y: 1,
        z: 0,
      });
      const a: IAutoMovieVector3 = Vector3.subtract(
        centre,
        Vector3.scale(axis, shape.halfLength),
      );
      let far: number = Math.max(
        sphere(a, shape.radius),
        sphere(
          Vector3.add(centre, Vector3.scale(axis, shape.halfLength)),
          shape.radius,
        ),
      );
      // The cylinder: the ray's component across the axis meets the radius.
      const oc: IAutoMovieVector3 = Vector3.subtract(origin, a);
      const dp: IAutoMovieVector3 = Vector3.subtract(
        d,
        Vector3.scale(axis, Vector3.dot(d, axis)),
      );
      const op: IAutoMovieVector3 = Vector3.subtract(
        oc,
        Vector3.scale(axis, Vector3.dot(oc, axis)),
      );
      const qa: number = Vector3.dot(dp, dp);
      if (qa > 1e-12) {
        const qb: number = Vector3.dot(op, dp);
        const disc: number =
          qb * qb - qa * (Vector3.dot(op, op) - shape.radius * shape.radius);
        if (disc >= 0) {
          const t: number = (-qb + Math.sqrt(disc)) / qa;
          const along: number = Vector3.dot(
            Vector3.add(oc, Vector3.scale(d, t)),
            axis,
          );
          if (along >= 0 && along <= 2 * shape.halfLength)
            far = Math.max(far, t);
        }
      }
      return far;
    }
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(rotation);
    const o: IAutoMovieVector3 = Quaternion.rotateVector(
      inverse,
      Vector3.subtract(origin, centre),
    );
    const dir: IAutoMovieVector3 = Quaternion.rotateVector(inverse, d);
    let near: number = -Infinity;
    let far: number = Infinity;
    if (shape.kind === "hull") {
      // Clip the ray against every face plane: it enters through the planes
      // it runs against and leaves through the ones it runs with.
      for (const face of physicalHullFaces(shape.points).faces) {
        const speed: number = Vector3.dot(face.normal, dir);
        const height: number = Vector3.dot(face.normal, o) - face.offset;
        if (Math.abs(speed) < 1e-12) {
          if (height > BOUNDARY) return -Infinity;
          continue;
        }
        if (speed < 0) near = Math.max(near, -height / speed);
        else far = Math.min(far, -height / speed);
      }
      return near <= far ? far : -Infinity;
    }
    if (shape.kind !== "box") {
      shape satisfies never;
      throw new Error("Unknown physical shape kind");
    }
    for (const k of ["x", "y", "z"] as const) {
      const h: number = shape.halfExtents[k];
      if (Math.abs(dir[k]) < 1e-12) {
        if (Math.abs(o[k]) > h + BOUNDARY) return -Infinity;
        continue;
      }
      const t1: number = (-h - o[k]) / dir[k];
      const t2: number = (h - o[k]) / dir[k];
      near = Math.max(near, Math.min(t1, t2));
      far = Math.min(far, Math.max(t1, t2));
    }
    return near <= far ? far : -Infinity;
  }

  /**
   * A point where a ray leaves a segment's colliders, with their outward
   * normal there.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the point and the normal are and in which frame.
   * @evidence contracts/development/design.md#principled-representation A surface sample: a world point and the collider's outward unit normal at it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two members a region frame is built from.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None; the normal is the exited collider's own, not the ray's direction.
   */
  export interface ISurfacePoint {
    /** The point, world metres in the rest pose. */
    point: IAutoMovieVector3;

    /** The outward unit normal there. */
    normal: IAutoMovieVector3;
  }

  /**
   * The rest pose readers every surface is resolved with: bones, segments,
   * collider bounds, bone-local frames, stations and ray exits of one body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each reader the record returns and the body it reads.
   * @evidence contracts/development/implementation.md#principled-implementation The rest pose resolved once; bounds are the union of the colliders' exact bounds; a ray's exit is the farthest exit over the segment's convex colliders, its normal that collider's.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Six small closures over one rest pose map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing bone, segment or hit throws rather than inventing a point.
   * @evidence contracts/development/implementation.md#efficient-algorithms One pose resolution; each read is linear in one segment's colliders.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every reader shares the one resolved rest pose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The closures retain only the one body's rest pose, released with them.
   */
  export function tools(skeleton: IAutoMovieSkeleton, profile: P) {
    const rest: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(
      resolvePose(
        { skeleton: skeleton.id, root: null, joints: [] },
        skeleton,
      ).map(
        (
          r: IAutoMovieResolvedBone,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
      ),
    );
    const at = (bone: AutoMovieHumanoidBone): IAutoMovieResolvedBone => {
      const r: IAutoMovieResolvedBone | undefined = rest.get(bone);
      if (r === undefined)
        throw new Error(`Surfaces need the rig bone ${bone}`);
      return r;
    };
    const segment = (bone: AutoMovieHumanoidBone): P.ISegment => {
      const s: P.ISegment | undefined = profile.segments.find(
        (x: P.ISegment): boolean => x.bone === bone,
      );
      if (s === undefined)
        throw new Error(`Surfaces need the profile segment ${bone}`);
      return s;
    };
    const bounds = (
      bone: AutoMovieHumanoidBone,
    ): { min: IAutoMovieVector3; max: IAutoMovieVector3 } => {
      const s: P.ISegment = segment(bone);
      const min: IAutoMovieVector3 = { x: Infinity, y: Infinity, z: Infinity };
      const max: IAutoMovieVector3 = {
        x: -Infinity,
        y: -Infinity,
        z: -Infinity,
      };
      for (const shape of s.shapes) {
        const b: { min: IAutoMovieVector3; max: IAutoMovieVector3 } =
          physicalShapeBounds(s.neutral, shape);
        for (const k of ["x", "y", "z"] as const) {
          min[k] = Math.min(min[k], b.min[k]);
          max[k] = Math.max(max[k], b.max[k]);
        }
      }
      return { min, max };
    };
    const local = (
      bone: AutoMovieHumanoidBone,
      world: IAutoMovieVector3,
      direction: IAutoMovieVector3,
      forward?: IAutoMovieVector3,
    ): resolveAutoMovieHumanoidSurfaces.IFrame => {
      const r: IAutoMovieResolvedBone = at(bone);
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(r.worldRotation);
      return {
        bone,
        point: Quaternion.rotateVector(
          inverse,
          Vector3.subtract(world, r.worldPosition),
        ),
        normal: Quaternion.rotateVector(inverse, Vector3.normalize(direction)),
        ...(forward === undefined
          ? {}
          : {
              forward: Quaternion.rotateVector(
                inverse,
                Vector3.normalize(forward),
              ),
            }),
      };
    };
    const station = (
      s: AutoMovieHumanoidSurfaceRegions.IStation,
    ): IAutoMovieVector3 => {
      if (s.toward === "centre") {
        const b = bounds(s.bone);
        return Vector3.scale(Vector3.add(b.min, b.max), 0.5);
      }
      return Vector3.lerp(
        at(s.bone).worldPosition,
        at(s.toward).worldPosition,
        s.share,
      );
    };
    const surface = (
      bone: AutoMovieHumanoidBone,
      origin: IAutoMovieVector3,
      direction: IAutoMovieVector3,
    ): ISurfacePoint => {
      const d: IAutoMovieVector3 = Vector3.normalize(direction);
      const s: P.ISegment = segment(bone);
      let far: number = -Infinity;
      let left: P.IShape | undefined;
      for (const shape of s.shapes) {
        const t: number = shapeExit(s.neutral, shape, origin, d);
        if (t > far) {
          far = t;
          left = shape;
        }
      }
      if (!(far > -Infinity) || left === undefined)
        throw new Error(`A surface ray from ${bone} misses its colliders`);
      const point: IAutoMovieVector3 = Vector3.add(
        origin,
        Vector3.scale(d, far),
      );
      return { point, normal: physicalShapeNormal(s.neutral, left, point, d) };
    };
    const exit = (
      bone: AutoMovieHumanoidBone,
      origin: IAutoMovieVector3,
      direction: IAutoMovieVector3,
    ): IAutoMovieVector3 => surface(bone, origin, direction).point;
    return { at, bounds, local, station, exit, surface };
  }
}

/** Metres a station may sit outside a collider and still count as on it: the colliders are closed sets, so a station on a face or a cap must not miss by rounding. */
const BOUNDARY: number = 1e-9;
