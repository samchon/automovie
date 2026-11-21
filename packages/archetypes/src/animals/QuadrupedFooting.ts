import {
  Quaternion,
  Vector3,
  physicalShapeSegmentDistance,
} from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type Archetype, ArchetypeFrame, ArchetypeRefusal } from "../core";
import { QuadrupedFootingClip } from "./QuadrupedFootingClip";
import { QuadrupedRestFloor } from "./QuadrupedRestFloor";

const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
const SIDES: readonly IAutoMovieQuaternion[] = [
  Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 90),
  Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, -90),
  Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -90),
  Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
];

type Interval = readonly [number, number];

/**
 * Authored world footing evaluated against actual emitted rigid parts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines named surface geometry and support roles on a film route.
 * @evidence contracts/development/design.md#principled-representation The planes own horizontal extent, independent tilt and world height. Coordinate frame and valid ranges are admitted at runtime.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Uses actual points, orientations and geometric primitives from their existing owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Authored set surfaces supply landing height and slope. There is no inferred path from the pictured terrain.
 */
export namespace QuadrupedFooting {
  /**
   * One bounded world plane, with slopes specified separately along +X and +Z.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Exact bounded plane expressed by world origin, intervals and unitless rise/run slopes.
   * @evidence contracts/development/design.md#principled-representation The rectangular footprint and independent slopes supply a single-valued finite surface.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Uses the existing world vector and transform contracts and exposes only values consumed along the route.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Authoring gives the physical terrain values, and query results do not use a renderer cache or fixture constants.
   */
  export interface IPlane {
    /** Name carried in terrain errors. */
    id: string;
    /** A point on the plane in world metres. */
    origin: IAutoMovieVector3;
    /** Lower-closed, upper-open world X interval, metres. */
    x: Interval;
    /** Lower-closed, upper-open world Z interval, metres. */
    z: Interval;
    /** Metres gained along each corresponding horizontal world axis. */
    slope: { x: number; z: number };
  }

  /**
   * One physical pole as a capsule spanning actual world endpoints.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A named physical pole is a finite capsule with its actual endpoint geometry.
   * @evidence contracts/development/design.md#principled-representation A closed segment and positive radius describe that solid without a hidden route cue.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Uses the existing world vector and transform contracts and exposes only values consumed along the route.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Authoring gives the physical terrain values, and query results do not use a renderer cache or fixture constants.
   */
  export interface IPole {
    /** Name carried in terrain errors. */
    id: string;
    /** Centre of the round start cap in world metres. */
    from: IAutoMovieVector3;
    /** Centre of the round end cap in world metres. */
    to: IAutoMovieVector3;
    /** Actual radius in metres. */
    radius: number;
  }

  /**
   * Explicit world geometry supplied by the filmed scene.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The scene owns a finite list of named landing regions and optional pole geometry.
   * @evidence contracts/development/design.md#principled-representation Input data contains the authored surfaces, obstacles and extra clearance control, each with its own units.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Uses the existing world vector and transform contracts and exposes only values consumed along the route.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Authoring gives the physical terrain values, and query results do not use a renderer cache or fixture constants.
   */
  export interface IScene {
    /** Independently placed landing surfaces. The highest surface wins where they overlap. */
    planes: readonly IPlane[];
    /** Optional active pole obstacles rendered by the authored scene. */
    poles?: readonly IPole[];
    /** Authored extra swing height in metres, in addition to the selected gait lift. */
    swingLift?: number;
  }

  /**
   * One point and upward unit normal in the owner's common frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names one exact contact-plane point and unit normal in a caller's current frame.
   * @evidence contracts/development/design.md#principled-representation The normal determines physical tangent and signed separation without a floor proxy.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Uses the existing world vector and transform contracts and exposes only values consumed along the route.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Authoring gives the physical terrain values, and query results do not use a renderer cache or fixture constants.
   */
  export interface ISurface {
    /** Contact-plane point in metres. */
    point: IAutoMovieVector3;
    /** Upward unit normal to that plane. */
    normal: IAutoMovieVector3;
  }

  /**
   * A projected model reference and terminal carrier established at one world landing.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the same authored plane and the neutral terminal orientation at landing.
   * @evidence contracts/development/design.md#principled-representation The rigid rotation independently carries the course's heading onto the surface normal.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Uses the existing world vector and transform contracts and exposes only values consumed along the route.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Authoring gives the physical terrain values, and query results do not use a renderer cache or fixture constants.
   */
  export interface ILanding extends ISurface {
    /** The hoof's neutral orientation along the landing surface, with its route heading. */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * An admitted terrain guide used throughout one route.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Offers independent surface queries and observed geometry admissibility for one route.
   * @evidence contracts/development/design.md#principled-representation Snapshot queries expose landings and whole-body checking without storing any current time state.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Uses the existing world vector and transform contracts and exposes only values consumed along the route.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Authoring gives the physical terrain values, and query results do not use a renderer cache or fixture constants.
   */
  export interface IPlan {
    /** Authored extra swing height in metres. */
    swingLift: number;
    /**
     * Read the authored surface at the horizontal footprint.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Receives the world footprint and its current unadjusted orientation and returns one new assigned plane frame.
     * @evidence contracts/development/implementation.md#principled-implementation Select the highest assigned plane and align the transported hoof attitude to its up normal.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Read each bounded region and emit the one concrete landing.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unassigned foothold refuses with its world coordinate.
     * @evidence contracts/development/implementation.md#efficient-algorithms One pass over the scene's S authored patches.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the admitted authored planes and uses existing quaternion and vector arithmetic.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns independent current vectors. No frame or sample is retained.
     */
    landing: (
      point: IAutoMovieVector3,
      rotation: IAutoMovieQuaternion,
    ) => ILanding;
    /**
     * Reject a currently emitted body whose solid geometry enters the named terrain.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Receives the actual primitive body and its world transform and refuses obstructed surfaces.
     * @evidence contracts/development/implementation.md#principled-implementation Project actual surfaces onto the authored plane normal and compare complete physical bounds against each pole segment.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Measure world part bounds, then check only relevant patches and any configured poles.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Sole points, expected joint coordinates and flag labels do not stand in for actual whole shapes.
     * @evidence contracts/development/implementation.md#efficient-algorithms Probes O(P) actual parts, each against at most S surfaces and K poles.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses existing actual primitive supports and the native segment-to-shape distance.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources All per-query geometry remains call-local.
     */
    verify: (
      animal: Pick<Archetype, "parts">,
      placement: IAutoMovieTransform,
    ) => void;
  }

  /**
   * Snapshot the route's requested terrain and make its two independent queries.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Spells out units, authored bounds, whole-geometry verification and typed refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Convert rise over run to a unit tilted normal. Read the highest authored region under each named landing. Later measure actual rigid part support against all spatially relevant planes and conservative pole clearances.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit geometry once, then retain helpers for landing and actual-pose verification.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing floor or obstructed body refuses. Pole checks bound complete cylindrical parts by containing physical capsules.
   * @evidence contracts/development/implementation.md#efficient-algorithms Landing reads each of S authored planes once. Verification reads P parts against S planes and K poles with a horizontal overlap test first.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuse actual primitive support and the engine's finite segment-to-solid distance, retaining plane-frame transforms across samples.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the caller's independent copied world geometry for one route's lifetime and no current frame or external resource.
   */
  export function prepare(
    archetype: string,
    scene: IScene | undefined,
    sliding: boolean,
  ): IPlan | undefined {
    if (scene === undefined) return undefined;
    if (scene === null || sliding)
      throw refusal(
        "Authored terrain needs surfaces and cannot be combined with a level slide stop.",
        scene,
      );
    const { planes, poles = [], swingLift = 0 } = structuredClone(scene);
    if (
      !Array.isArray(planes) ||
      planes.length === 0 ||
      !Array.isArray(poles) ||
      !(Number.isFinite(swingLift) && swingLift >= 0)
    )
      throw refusal(
        "The scene needs named finite support planes and an admitted swing lift.",
        scene,
      );
    const names: Set<string> = new Set();
    const surfaces: {
      plane: IPlane;
      normal: IAutoMovieVector3;
      frame: IAutoMovieTransform;
    }[] = planes.map((plane: IPlane) => {
      const { slope, origin, x, z } = plane;
      name(plane.id);
      if (
        !finitePoint(origin) ||
        !interval(x) ||
        !interval(z) ||
        slope === null ||
        slope === undefined ||
        ![slope.x, slope.z].every(Number.isFinite)
      )
        throw refusal(
          "A support plane needs finite point, slope and ordered bounds.",
          plane.id,
        );
      const normal: IAutoMovieVector3 = Vector3.normalize({
        x: -slope.x,
        y: 1,
        z: -slope.z,
      });
      const rotation: IAutoMovieQuaternion = turn(normal, UP);
      return {
        plane,
        normal,
        frame: {
          rotation,
          translation: Quaternion.rotateVector(
            rotation,
            Vector3.scale(origin, -1),
          ),
          scale: ArchetypeFrame.UNIT,
        },
      };
    });
    for (const pole of poles) {
      name(pole.id);
      if (
        !finitePoint(pole.from) ||
        !finitePoint(pole.to) ||
        !(Vector3.distance(pole.from, pole.to) > 0) ||
        !(Number.isFinite(pole.radius) && pole.radius > 0)
      )
        throw refusal(
          "A pole needs two distinct finite world points and a positive radius.",
          pole.id,
        );
    }
    return { swingLift, landing, verify };

    /** Give each terrain component one stable public diagnostic identity. */
    function name(id: string): void {
      if (typeof id !== "string" || id.length === 0 || names.has(id))
        throw refusal("Terrain names must be nonempty and unique.", id);
      names.add(id);
    }

    /** Choose the topmost real patch below the footprint and orient the actual carried axes. */
    function landing(
      point: IAutoMovieVector3,
      rotation: IAutoMovieQuaternion,
    ): ILanding {
      let result: ILanding | undefined;
      for (const { plane, normal } of surfaces) {
        if (
          point.x < plane.x[0] ||
          point.x >= plane.x[1] ||
          point.z < plane.z[0] ||
          point.z >= plane.z[1]
        )
          continue;
        const y: number =
          plane.origin.y +
          (point.x - plane.origin.x) * plane.slope.x +
          (point.z - plane.origin.z) * plane.slope.z;
        if (!Number.isFinite(y))
          throw refusal(
            "The assigned foothold height is unrepresentable.",
            plane.id,
          );
        if (result !== undefined && y <= result.point.y) continue;
        result = {
          point: { ...point, y },
          normal: { ...normal },
          rotation: Quaternion.multiply(
            turn(Quaternion.rotateVector(rotation, UP), normal),
            rotation,
          ),
        };
      }
      if (result === undefined)
        throw refusal("No authored surface covers this hoof landing.", point);
      return result;
    }

    /** Check actual oriented shapes against each overlapping finite patch and physical pole. */
    function verify(
      animal: Pick<Archetype, "parts">,
      placement: IAutoMovieTransform,
    ): void {
      for (const record of animal.parts) {
        if (
          record.transform === null ||
          record.transform === undefined ||
          record.geometry.type !== "primitive"
        )
          throw refusal(
            "Footing needs transformed rigid primitive parts.",
            record.id,
          );
        if (record.geometry.shape.type === "plane") continue;
        const part: IAutoMovieModelPart = {
          ...record,
          transform: ArchetypeFrame.compose(placement, record.transform),
        };
        const [minX, maxX, minZ, maxZ]: number[] = SIDES.map(
          (rotation: IAutoMovieQuaternion): number =>
            lowest(part, {
              rotation,
              translation: { x: 0, y: 0, z: 0 },
              scale: ArchetypeFrame.UNIT,
            }),
        );
        const roundoff: number =
          256 *
          Number.EPSILON *
          Math.max(1, Vector3.length(part.transform!.translation));
        for (const { plane, frame } of surfaces)
          if (
            minX! < plane.x[1] &&
            -maxX! > plane.x[0] &&
            minZ! < plane.z[1] &&
            -maxZ! > plane.z[0] &&
            lowest(part, frame) < -roundoff &&
            QuadrupedFootingClip(part, plane, frame) < -roundoff
          )
            throw refusal(
              `Actual ${part.id} enters named surface ${plane.id}.`,
              plane.id,
            );
        if (poles.length === 0) continue;
        const bounds: IAutoMoviePhysicalShape = obstacleShape(part);
        for (const pole of poles)
          if (
            physicalShapeSegmentDistance(
              {
                position: { x: 0, y: 0, z: 0 },
                rotation: Quaternion.identity(),
              },
              bounds,
              pole.from,
              pole.to,
            ) <
            pole.radius - roundoff
          )
            throw refusal(
              `Actual ${part.id} intersects the clearance of ${pole.id}.`,
              pole.id,
            );
      }
    }

    /** Carry the route's author-facing typed refusal contract. */
    function refusal(reason: string, value: unknown): ArchetypeRefusal {
      return new ArchetypeRefusal({
        kind: "parameter",
        archetype,
        axis: "footing",
        value,
        feasible: null,
        reason,
        fix: "Supply reachable named surfaces and clear the authored obstacles.",
      });
    }
  }
}

/** Require finite world position coordinates. */
function finitePoint(point: IAutoMovieVector3): boolean {
  return (
    point !== null &&
    point !== undefined &&
    [point.x, point.y, point.z].every(Number.isFinite)
  );
}

/** Admit an explicit half-open world patch interval. */
function interval(span: Interval): boolean {
  return (
    Array.isArray(span) &&
    span.length === 2 &&
    span.every(Number.isFinite) &&
    span[0] < span[1]
  );
}

/** Turn the admitted unit surface normal to another unit up vector. */
function turn(
  from: IAutoMovieVector3,
  to: IAutoMovieVector3,
): IAutoMovieQuaternion {
  const axis: IAutoMovieVector3 = Vector3.cross(from, to);
  const magnitude: number = Vector3.length(axis);
  return Quaternion.fromAxisAngle(
    axis,
    (Math.atan2(magnitude, Vector3.dot(from, to)) * 180) / Math.PI,
  );
}

/** Exact lowest coordinate of a transformed complete primitive. */
function lowest(part: IAutoMovieModelPart, frame: IAutoMovieTransform): number {
  return QuadrupedRestFloor({
    ...part,
    transform: ArchetypeFrame.compose(frame, part.transform!),
  });
}

/** Keep the original pole query conservative for cylindrical and conical model parts. */
function obstacleShape(part: IAutoMovieModelPart): IAutoMoviePhysicalShape {
  if (
    part.geometry.type !== "primitive" ||
    part.geometry.shape.type === "plane"
  )
    throw new RangeError("A pole query requires a physical part");
  const shape = part.geometry.shape;
  const base = {
    id: part.id,
    material: "footing",
    transform: {
      position: part.transform!.translation,
      rotation: part.transform!.rotation,
    },
  };
  if (shape.type === "box")
    return {
      ...base,
      kind: "box",
      halfExtents: {
        x: shape.width / 2,
        y: shape.height / 2,
        z: shape.depth / 2,
      },
    };
  if (shape.type === "sphere")
    return { ...base, kind: "sphere", radius: shape.radius };
  return {
    ...base,
    kind: "capsule",
    radius: shape.radius,
    halfLength: shape.height / 2,
  };
}
