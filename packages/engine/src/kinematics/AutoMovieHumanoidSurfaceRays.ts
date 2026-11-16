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
  /** Actual ray queries share only one fixed rest-shape frame. */
  type Exit = (origin: IAutoMovieVector3, direction: IAutoMovieVector3) => number;

  /** A rest collider shares fixed exit/normal metadata, never a ray or surface answer. */
  interface IShapeReading {
    /** Original admitted collider, borrowed only with its unchanged segment. */
    shape: P.IShape;

    /** Actual origin/direction intersection through the collider. */
    exit: Exit;

    /** Acquired only when this collider first wins a surface ray. */
    normal?: ReturnType<typeof physicalShapeNormal.prepare>;
  }

  /** Prepare the fixed shape frame; every actual ray retains the original exact intersection. */
  function prepareExit(
    frame: P.ITransform,
    shape: P.IShape,
  ): Exit {
    const centre: IAutoMovieVector3 = Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, shape.transform.position),
    );
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      frame.rotation,
      shape.transform.rotation,
    );
    if (shape.kind === "sphere")
      return (origin: IAutoMovieVector3, d: IAutoMovieVector3): number => sphereExit(origin, d, centre, shape.radius);
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
      const b: IAutoMovieVector3 = Vector3.add(centre, Vector3.scale(axis, shape.halfLength));
      return (origin: IAutoMovieVector3, d: IAutoMovieVector3): number => {
        let far: number = Math.max(
          sphereExit(origin, d, a, shape.radius),
          sphereExit(origin, d, b, shape.radius),
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
      };
    }
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(rotation);
    const faces: readonly physicalHullFaces.IFace[] | undefined = shape.kind === "hull"
      ? physicalHullFaces(shape.points).faces : undefined;
    return (origin: IAutoMovieVector3, d: IAutoMovieVector3): number => {
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
        for (const face of faces!) {
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
    };
  }

  /** Preserve the ray-sphere discriminant and boundary branch without a per-ray closure. */
  function sphereExit(
    origin: IAutoMovieVector3,
    direction: IAutoMovieVector3,
    centre: IAutoMovieVector3,
    radius: number,
  ): number {
    const oc: IAutoMovieVector3 = Vector3.subtract(origin, centre);
    const b: number = Vector3.dot(oc, direction);
    const disc: number = b * b - (Vector3.dot(oc, oc) - radius * radius);
    return disc < -BOUNDARY * radius ? -Infinity : -b + Math.sqrt(Math.max(0, disc));
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
   * Rest-pose readers for one unchanged body's surface resolution: bones,
   * segments, bounds, bone-local frames, stations and actual ray exits.
   * Release this bundle after the resolution, and create another after any
   * rig/profile edit. Returned bounds own their vectors independently.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the readers, unchanged-body epoch, bundle release point and independent returned bounds.
   * @evidence contracts/development/implementation.md#principled-implementation The rest pose resolved once; bounds are the union of the colliders' exact bounds; a ray's exit is the farthest exit over the segment's convex colliders, its normal that collider's.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rest pose and first-name index serve the bundle; lazy bounds and fixed rest-shape exit/physical-normal reader pairs keep invariant geometry separate from every current station, ray and normal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing bone, segment or hit still throws. Every current ray tests all original colliders with the same discriminants, plane/slab order, BOUNDARY and 1e-12 branches; only fixed frames, capsule axes/endpoints and hull planes are prepared.
   * @evidence contracts/development/implementation.md#efficient-algorithms One pose and O(S) index precede lazy segment bounds and exit preparation. Fixed rest transforms/inverses/capsule ends serve all rays, and only a winning normal's first actual point prepares its physical axis/inverse/planes. Hull bounds rotate V points once per segment; actual rays retain their collider/face work and returned bounds copy six coordinates.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The explicit unchanged rig/profile epoch proves equal rest bounds and shape frames. First-name indexing preserves duplicate-name precedence, and every ray's origin/direction, exit, winning collider and outward normal are computed anew without query-result reuse.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The bundle owns O(B) rest data, O(S) names/bounds and one fixed exit per queried collider. A normal reader and its planes are acquired only after that collider first wins a ray. The caller releases all on completion or throw; no query point/result enters these maps and no body-global pose or ray history is retained.
   */
  export function tools(skeleton: IAutoMovieSkeleton, profile: P) {
    const segments: Map<string, P.ISegment> = new Map();
    for (const part of profile.segments)
      if (!segments.has(part.bone)) segments.set(part.bone, part);
    const extents: Map<P.ISegment, ReturnType<typeof physicalShapeBounds>> = new Map();
    const exits: Map<P.ISegment, IShapeReading[]> = new Map();
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
    const segment: (bone: AutoMovieHumanoidBone) => P.ISegment = (bone: AutoMovieHumanoidBone): P.ISegment => {
      const s: P.ISegment | undefined = segments.get(bone);
      if (s === undefined)
        throw new Error(`Surfaces need the profile segment ${bone}`);
      return s;
    };
    const bounds = (
      bone: AutoMovieHumanoidBone,
    ): { min: IAutoMovieVector3; max: IAutoMovieVector3 } => {
      const s: P.ISegment = segment(bone);
      let known: ReturnType<typeof physicalShapeBounds> | undefined = extents.get(s);
      if (known !== undefined)
        return { min: { ...known.min }, max: { ...known.max } };
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
      known = { min, max };
      extents.set(s, known);
      return { min: { ...min }, max: { ...max } };
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
      let readings: IShapeReading[] | undefined = exits.get(s);
      if (readings === undefined) {
        readings = s.shapes.map((shape: P.IShape): IShapeReading => ({
          shape,
          exit: prepareExit(s.neutral, shape),
        }));
        exits.set(s, readings);
      }
      let far: number = -Infinity;
      let left: IShapeReading | undefined;
      for (let i: number = 0; i < s.shapes.length; i++) {
        const t: number = readings[i]!.exit(origin, d);
        if (t > far) {
          far = t;
          left = readings[i]!;
        }
      }
      if (!(far > -Infinity) || left === undefined)
        throw new Error(`A surface ray from ${bone} misses its colliders`);
      const point: IAutoMovieVector3 = Vector3.add(
        origin,
        Vector3.scale(d, far),
      );
      const normal: ReturnType<typeof physicalShapeNormal.prepare> = left.normal ??=
        physicalShapeNormal.prepare(s.neutral, left.shape);
      return { point, normal: normal(point, d) };
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
