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

import {
  type AutoMovieArchetype,
  type AutoMovieArchetypeConvexCell,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
} from "../core";
import { QuadrupedFootingClip } from "./QuadrupedFootingClip";
import { QuadrupedObstacleShape } from "./QuadrupedObstacleShape";
import { QuadrupedRestFloor } from "./QuadrupedRestFloor";

const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
const SIDES: readonly IAutoMovieQuaternion[] = [
  Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 90),
  Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, -90),
  Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -90),
  Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
];

type Interval = readonly [number, number];

/** Authored world footing evaluated against emitted rigid parts. */
export namespace AutoMovieArchetypeQuadrupedFooting {
  /** One bounded world plane, with slopes specified separately along +X and +Z. */
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
    /** A yielding surface's sinkage under a loaded hoof; firm when absent. */
    yield?: IYield;
  }

  /**
   * A yielding surface: sand, mud, bog or snow, and how deep a loaded hoof
   * sinks into it.
   */
  export interface IYield {
    /** The footing's material. */
    material: Material;
    /** How far a loaded hoof's sole sinks below the surface, metres. */
    depth: number;
    /** Where the depth comes from: a citation, or "authored". */
    source: string;
  }

  /** A yielding footing's material. */
  export type Material = "sand" | "mud" | "bog" | "snow";

  /** One physical pole as a capsule spanning world endpoints. */
  export interface IPole {
    /** Name carried in terrain errors. */
    id: string;
    /** Centre of the round start cap in world metres. */
    from: IAutoMovieVector3;
    /** Centre of the round end cap in world metres. */
    to: IAutoMovieVector3;
    /** Radius in metres. */
    radius: number;
  }

  /** Explicit world geometry supplied by the filmed scene. */
  export interface IScene {
    /**
     * Independently placed landing surfaces. The highest surface wins where
     * they overlap.
     */
    planes: readonly IPlane[];
    /** Optional active pole obstacles rendered by the authored scene. */
    poles?: readonly IPole[];
    /**
     * Authored extra swing height in metres, in addition to the selected gait
     * lift.
     */
    swingLift?: number;
  }

  /** One point and upward unit normal in the owner's common frame. */
  export interface ISurface {
    /** Contact-plane point in metres. */
    point: IAutoMovieVector3;
    /** Upward unit normal to that plane. */
    normal: IAutoMovieVector3;
  }

  /**
   * A projected model reference and terminal carrier established at one world
   * landing.
   */
  export interface ILanding extends ISurface {
    /** Named surface that owns the accepted landing. */
    surface: string;
    /**
     * The hoof's neutral orientation along the landing surface, with its route
     * heading.
     */
    rotation: IAutoMovieQuaternion;
    /**
     * How far the loaded sole sinks below the surface, metres; zero on firm
     * footing. The landing point is already that far down.
     */
    depth: number;
  }

  /** An admitted terrain guide used throughout one route. */
  export interface IPlan {
    /**
     * Authored extra swing height in metres, plus the deepest yielding
     * surface's sinkage, so a swinging hoof clears the displaced footing.
     */
    swingLift: number;
    /**
     * The admitted poles, world metres, which a swing lifts over where its hoof
     * crosses them (`QuadrupedPoleSwing`).
     */
    poles: readonly IPole[];
    /** Read the authored surface at the horizontal footprint. */
    landing: (
      point: IAutoMovieVector3,
      rotation: IAutoMovieQuaternion,
    ) => ILanding;
    /**
     * Reject a currently emitted body whose solid geometry enters the named
     * terrain.
     */
    verify: (
      animal: Pick<AutoMovieArchetype, "parts"> &
        Partial<Pick<AutoMovieArchetype, "convexCells">>,
      placement: IAutoMovieTransform,
    ) => void;
  }

  /**
   * Snapshot the route's requested terrain and make its two independent
   * queries.
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
    if (planes.length === 0 || !(swingLift >= 0))
      throw refusal(
        "The scene needs named finite support planes and an admitted swing lift.",
        scene,
      );
    const names: Set<string> = new Set();
    const surfaces: {
      plane: IPlane;
      normal: IAutoMovieVector3;
      frame: IAutoMovieTransform;
      clearance: ReturnType<typeof QuadrupedFootingClip.prepare>;
    }[] = planes.map((plane: IPlane) => {
      const { slope, origin, x, z } = plane;
      name(plane.id);
      if (
        !finitePoint(origin) ||
        !interval(x) ||
        !interval(z) ||
        slope === null ||
        slope === undefined
      )
        throw refusal(
          "A support plane needs finite point, slope and ordered bounds.",
          plane.id,
        );
      if (
        plane.yield !== undefined &&
        !(
          ["sand", "mud", "bog", "snow"].includes(plane.yield.material) &&
          plane.yield.depth >= 0 &&
          plane.yield.source.length > 0
        )
      )
        throw refusal(
          "A yielding plane needs a known material, a finite nonnegative depth and its source.",
          plane.id,
        );
      const normal: IAutoMovieVector3 = Vector3.normalize({
        x: -slope.x,
        y: 1,
        z: -slope.z,
      });
      const rotation: IAutoMovieQuaternion = turn(normal, UP);
      const frame: IAutoMovieTransform = {
        rotation,
        translation: Quaternion.rotateVector(
          rotation,
          Vector3.scale(origin, -1),
        ),
        scale: AutoMovieArchetypeFrame.UNIT,
      };
      return {
        plane,
        normal,
        frame,
        clearance: QuadrupedFootingClip.prepare(plane, frame),
      };
    });
    for (const pole of poles) {
      name(pole.id);
      if (
        !finitePoint(pole.from) ||
        !finitePoint(pole.to) ||
        !(Vector3.distance(pole.from, pole.to) > 0) ||
        !(pole.radius > 0)
      )
        throw refusal(
          "A pole needs two distinct finite world points and a positive radius.",
          pole.id,
        );
    }
    const deepest: number = Math.max(
      0,
      ...surfaces.map(({ plane }): number => plane.yield?.depth ?? 0),
    );
    return { swingLift: swingLift + deepest, poles, landing, verify };

    /** Give each terrain component one stable public diagnostic identity. */
    function name(id: string): void {
      if (id.length === 0 || names.has(id))
        throw refusal("Terrain names must be nonempty and unique.", id);
      names.add(id);
    }

    /**
     * Choose the topmost real patch below the footprint and orient the carried
     * axes.
     */
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
        if (result !== undefined && y <= result.point.y + result.depth)
          continue;
        const depth: number = plane.yield?.depth ?? 0;
        result = {
          surface: plane.id,
          depth,
          point: { ...point, y: y - depth },
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

    /**
     * Check oriented shapes against each overlapping finite patch and physical
     * pole.
     */
    function verify(
      animal: Pick<AutoMovieArchetype, "parts"> &
        Partial<Pick<AutoMovieArchetype, "convexCells">>,
      placement: IAutoMovieTransform,
    ): void {
      const cells: AutoMovieArchetypeConvexCell.Table | undefined =
        animal.convexCells;
      for (const record of animal.parts) {
        if (
          record.transform === null ||
          record.transform === undefined ||
          (record.geometry.type !== "primitive" &&
            cells?.get(record.id)?.geometry !== record.geometry)
        )
          throw refusal(
            "Footing needs transformed rigid parts with matching solids.",
            record.id,
          );
        if (
          record.geometry.type === "primitive" &&
          record.geometry.shape.type === "plane"
        )
          continue;
        const part: IAutoMovieModelPart = {
          ...record,
          transform: AutoMovieArchetypeFrame.compose(
            placement,
            record.transform,
          ),
        };
        const [minX, maxX, minZ, maxZ]: number[] = SIDES.map(
          (rotation: IAutoMovieQuaternion): number =>
            lowest(
              part,
              {
                rotation,
                translation: { x: 0, y: 0, z: 0 },
                scale: AutoMovieArchetypeFrame.UNIT,
              },
              cells,
            ),
        );
        const roundoff: number =
          256 *
          Number.EPSILON *
          Math.max(1, Vector3.length(part.transform!.translation));
        for (const { plane, frame, clearance } of surfaces)
          if (
            minX! < plane.x[1] &&
            -maxX! > plane.x[0] &&
            minZ! < plane.z[1] &&
            -maxZ! > plane.z[0] &&
            lowest(part, frame, cells) <
              -(plane.yield?.depth ?? 0) - roundoff &&
            clearance(part, cells) < -(plane.yield?.depth ?? 0) - roundoff
          )
            throw refusal(
              `Actual ${part.id} enters named surface ${plane.id}.`,
              plane.id,
            );
        if (poles.length === 0) continue;
        const bounds: IAutoMoviePhysicalShape = QuadrupedObstacleShape(
          part,
          cells,
        );
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
    function refusal(
      reason: string,
      value: unknown,
    ): AutoMovieArchetypeRefusal {
      return new AutoMovieArchetypeRefusal({
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
  return point !== null && point !== undefined;
}

/** Admit an explicit half-open world patch interval. */
function interval(span: Interval): boolean {
  return span.length === 2 && span[0] < span[1];
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

/** Exact lowest coordinate of a transformed complete solid. */
function lowest(
  part: IAutoMovieModelPart,
  frame: IAutoMovieTransform,
  cells: AutoMovieArchetypeConvexCell.Table | undefined,
): number {
  return QuadrupedRestFloor(
    {
      ...part,
      transform: AutoMovieArchetypeFrame.compose(frame, part.transform!),
    },
    cells,
  );
}
