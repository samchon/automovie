import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanoidSurfaceRays,
  IAutoMovieHumanoidSurfaceRegions,
  IAutoMovieHumanoidSurfaces,
  IAutoMoviePhysicalHullFaces,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { AutoMovieEnginePhysics } from "../physics/AutoMovieEnginePhysics";
import { physicalShapeBoundsImplementation } from "../physics/internal/physicalShapeBoundsImplementation";
import { physicalShapeHull } from "../physics/internal/physicalShapeHull";
import type { AutoMovieHumanoidSurfaceRegions } from "./AutoMovieHumanoidSurfaceRegions";
import { AutoMovieHumanoidNeutralBounds } from "./internal/AutoMovieHumanoidNeutralBounds";
import { resolvePose } from "./internal/resolvePose";

/**
 * The rest-pose readers a humanoid's surfaces are resolved with
 * (`resolveAutoMovieHumanoidSurfaces`): its bones, segments, collider bounds,
 * bone-local frames, stations, and the exits of rays from them through the
 * colliders with the colliders' outward normal there.
 */
export namespace AutoMovieHumanoidSurfaceRays {
  /**
   * Rest-pose readers for one unchanged body's surface resolution: bones,
   * segments, bounds, bone-local frames, stations and actual ray exits. Release
   * this bundle after the resolution, and create another after any rig/profile
   * edit. Returned bounds own their vectors independently.
   */
  export function tools(
    skeleton: IAutoMovieSkeleton,
    profile: IAutoMoviePhysicalProfile,
    neutral?: AutoMovieHumanoidNeutralBounds.IPrepared,
  ): ITools {
    const segments: Map<string, IAutoMoviePhysicalSegment> = new Map();
    for (const part of profile.segments)
      if (!segments.has(part.bone)) segments.set(part.bone, part);
    const extents: Map<
      IAutoMoviePhysicalSegment,
      ReturnType<typeof physicalShapeBoundsImplementation.physicalShapeBounds>
    > = new Map();
    const exits: Map<IAutoMoviePhysicalSegment, IShapeReading[]> = new Map();
    for (const s of segments.values()) {
      extents.set(s, AutoMovieHumanoidNeutralBounds.read(profile, s, neutral));
      exits.set(
        s,
        s.shapes.map(
          (shape: IAutoMoviePhysicalShape): IShapeReading => ({
            shape,
            exit: prepareExit(s.neutral, shape),
            normal: AutoMovieEnginePhysics.physicalShapeNormalPrepare(
              s.neutral,
              shape,
            ),
          }),
        ),
      );
    }
    const rest: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
    for (const resolved of resolvePose(
      { skeleton: skeleton.id, root: null, joints: [] },
      skeleton,
    ))
      rest.set(resolved.bone, resolved);
    const at = (bone: AutoMovieHumanoidBone): IAutoMovieResolvedBone => {
      const r: IAutoMovieResolvedBone | undefined = rest.get(bone);
      if (r === undefined)
        throw new Error(`Surfaces need the rig bone ${bone}`);
      return r;
    };
    const segment: (
      bone: AutoMovieHumanoidBone,
    ) => IAutoMoviePhysicalSegment = (
      bone: AutoMovieHumanoidBone,
    ): IAutoMoviePhysicalSegment => {
      const s: IAutoMoviePhysicalSegment | undefined = segments.get(bone);
      if (s === undefined)
        throw new Error(`Surfaces need the profile segment ${bone}`);
      return s;
    };
    const bounds = (
      bone: AutoMovieHumanoidBone,
    ): { min: IAutoMovieVector3; max: IAutoMovieVector3 } => {
      const s: IAutoMoviePhysicalSegment = segment(bone);
      const known: ReturnType<
        typeof physicalShapeBoundsImplementation.physicalShapeBounds
      > = extents.get(s)!;
      return { min: { ...known.min }, max: { ...known.max } };
    };
    const local = (
      bone: AutoMovieHumanoidBone,
      world: IAutoMovieVector3,
      direction: IAutoMovieVector3,
      forward?: IAutoMovieVector3,
    ): IAutoMovieHumanoidSurfaces.IFrame => {
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
    // The body's stature, the top of its colliders at rest above the floor
    // at zero, as `measureAutoMovieHumanoidBody` reads it; read by the first
    // station placed by a level.
    let stature: number = -Infinity;
    for (const part of profile.segments)
      stature = Math.max(
        stature,
        AutoMovieHumanoidNeutralBounds.read(profile, part, neutral).max.y,
      );
    const station = (
      s:
        | IAutoMovieHumanoidSurfaceRegions.IStation
        | AutoMovieHumanoidSurfaceRegions.ILevel,
    ): IAutoMovieVector3 => {
      if ("level" in s) {
        const from: IAutoMovieVector3 = at(s.bone).worldPosition;
        const to: IAutoMovieVector3 = at(s.toward).worldPosition;
        const share: number = (s.level * stature - from.y) / (to.y - from.y);
        if (!(share >= 0 && share <= 1))
          throw new Error(
            `Surfaces place a level of ${s.level} of the stature on the segment from ${s.bone} to ${s.toward}, which spans ${from.y} to ${to.y} m`,
          );
        return Vector3.lerp(from, to, share);
      }
      if (s.toward === "centre") {
        const b: ReturnType<typeof bounds> = bounds(s.bone);
        const middle: IAutoMovieVector3 = Vector3.add(b.min, b.max);
        middle.x *= 0.5;
        middle.y *= 0.5;
        middle.z *= 0.5;
        return middle;
      }
      return Vector3.lerp(
        at(s.bone).worldPosition,
        at(s.toward).worldPosition,
        s.share,
      );
    };
    /*
     * The demand is private; every entry still tests all original colliders and
     * the same miss gate.
     */
    function trace(
      bone: AutoMovieHumanoidBone,
      origin: IAutoMovieVector3,
      direction: IAutoMovieVector3,
      readNormal: false,
    ): IAutoMovieVector3;
    function trace(
      bone: AutoMovieHumanoidBone,
      origin: IAutoMovieVector3,
      direction: IAutoMovieVector3,
      readNormal: true,
    ): IAutoMovieHumanoidSurfaceRays.ISurfacePoint;
    function trace(
      bone: AutoMovieHumanoidBone,
      origin: IAutoMovieVector3,
      direction: IAutoMovieVector3,
      readNormal: boolean,
    ): IAutoMovieVector3 | IAutoMovieHumanoidSurfaceRays.ISurfacePoint {
      const d: IAutoMovieVector3 = Vector3.normalize(direction);
      const s: IAutoMoviePhysicalSegment = segment(bone);
      const readings: IShapeReading[] = exits.get(s)!;
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
      const point: IAutoMovieVector3 = Vector3.scale(d, far);
      point.x = origin.x + point.x;
      point.y = origin.y + point.y;
      point.z = origin.z + point.z;
      if (!readNormal) return point;
      return { point, normal: left.normal(point, d) };
    }
    const surface = (
      bone: AutoMovieHumanoidBone,
      origin: IAutoMovieVector3,
      direction: IAutoMovieVector3,
    ): IAutoMovieHumanoidSurfaceRays.ISurfacePoint =>
      trace(bone, origin, direction, true);
    const exit = (
      bone: AutoMovieHumanoidBone,
      origin: IAutoMovieVector3,
      direction: IAutoMovieVector3,
    ): IAutoMovieVector3 => trace(bone, origin, direction, false);
    return { at, bounds, local, station, exit, surface };
  }

  /*
   * Actual ray queries share only one fixed rest-shape frame.
   */
  type Exit = (
    origin: IAutoMovieVector3,
    direction: IAutoMovieVector3,
  ) => number;

  /*
   * A rest collider shares fixed exit/normal metadata, never a ray or surface
   * answer.
   */
  interface IShapeReading {
    /*
     * Original admitted collider, borrowed only with its unchanged segment.
     */
    shape: IAutoMoviePhysicalShape;

    /*
     * Actual origin/direction intersection through the collider.
     */
    exit: Exit;

    /*
     * The collider's surface normal reader.
     */
    normal: ReturnType<
      typeof AutoMovieEnginePhysics.physicalShapeNormalPrepare
    >;
  }

  /*
   * The six actual rest observations consumed by anatomical surface owners.
   */
  interface ITools {
    /*
     * Current reader-owned resolved rest bone; missing bones throw.
     */
    at: (bone: AutoMovieHumanoidBone) => IAutoMovieResolvedBone;

    /*
     * Fresh vectors for the segment's exact neutral world-axis bounds.
     */
    bounds: (bone: AutoMovieHumanoidBone) => {
      min: IAutoMovieVector3;
      max: IAutoMovieVector3;
    };

    /*
     * Express the actual world point/directions relative to the current rest
     * joint.
     */
    local: (
      bone: AutoMovieHumanoidBone,
      world: IAutoMovieVector3,
      direction: IAutoMovieVector3,
      forward?: IAutoMovieVector3,
    ) => IAutoMovieHumanoidSurfaces.IFrame;

    /*
     * Actual anatomical station from rest joints, exact collider centre or a
     * level of the body's stature on a segment.
     */
    station: (
      station:
        | IAutoMovieHumanoidSurfaceRegions.IStation
        | AutoMovieHumanoidSurfaceRegions.ILevel,
    ) => IAutoMovieVector3;

    /*
     * Actual farthest collider exit point for the current ray.
     */
    exit: (
      bone: AutoMovieHumanoidBone,
      origin: IAutoMovieVector3,
      direction: IAutoMovieVector3,
    ) => IAutoMovieVector3;

    /*
     * Actual collider exit point and its physical outward normal.
     */
    surface: (
      bone: AutoMovieHumanoidBone,
      origin: IAutoMovieVector3,
      direction: IAutoMovieVector3,
    ) => IAutoMovieHumanoidSurfaceRays.ISurfacePoint;
  }

  /*
   * Prepare the fixed shape frame; every actual ray retains the original exact
   * intersection.
   */
  function prepareExit(
    frame: IAutoMovieRigidTransform,
    shape: IAutoMoviePhysicalShape,
  ): Exit {
    const parentPosition: IAutoMovieVector3 = frame.position;
    const centre: IAutoMovieVector3 = Quaternion.rotateVector(
      frame.rotation,
      shape.transform.position,
    );
    centre.x = parentPosition.x + centre.x;
    centre.y = parentPosition.y + centre.y;
    centre.z = parentPosition.z + centre.z;
    if (shape.kind === "sphere")
      return (origin: IAutoMovieVector3, d: IAutoMovieVector3): number =>
        sphereExit(origin, d, centre, shape.radius);
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      frame.rotation,
      shape.transform.rotation,
    );
    if (shape.kind === "capsule") {
      const axis: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
        x: 0,
        y: 1,
        z: 0,
      });
      const halfAxis: IAutoMovieVector3 = Vector3.scale(axis, shape.halfLength);
      const a: IAutoMovieVector3 = Vector3.subtract(centre, halfAxis);
      const b: IAutoMovieVector3 = Vector3.add(centre, halfAxis);
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
    const faces: readonly IAutoMoviePhysicalHullFaces.IFace[] | undefined =
      shape.kind === "hull" ? physicalShapeHull(shape).faces : undefined;
    return (origin: IAutoMovieVector3, d: IAutoMovieVector3): number => {
      const o: IAutoMovieVector3 = Quaternion.rotateVector(inverse, {
        x: origin.x - centre.x,
        y: origin.y - centre.y,
        z: origin.z - centre.z,
      });
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

  /*
   * Preserve the ray-sphere discriminant and boundary branch without a per-ray
   * closure.
   */
  function sphereExit(
    origin: IAutoMovieVector3,
    direction: IAutoMovieVector3,
    centre: IAutoMovieVector3,
    radius: number,
  ): number {
    const oc: IAutoMovieVector3 = Vector3.subtract(origin, centre);
    const b: number = Vector3.dot(oc, direction);
    const disc: number = b * b - (Vector3.dot(oc, oc) - radius * radius);
    return disc < -BOUNDARY * radius
      ? -Infinity
      : -b + Math.sqrt(Math.max(0, disc));
  }
}

/*
 * Metres a station may sit outside a collider and still count as on it: the
 * colliders are closed sets, so a station on a face or a cap must not miss by
 * rounding.
 */
const BOUNDARY: number = 1e-9;
