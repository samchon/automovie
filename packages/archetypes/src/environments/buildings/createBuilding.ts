import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModule,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieArchetypeDoor } from "../../architecture/AutoMovieArchetypeDoor";
import { assembleBuilding } from "./assembleBuilding";
import { buildingPlans } from "./buildingPlans";

/**
 * Prepare a placed building from metre floor plans or an exterior footprint.
 *
 * Drafts and checks its levels once. Each module placement constructs a
 * separately identified building in a world-upright frame. Room anchors are
 * named `<level>/<room>` and openings `<level>/<opening>`, with their +Z
 * pointing from the first room toward the second or outdoors.
 *
 * @param props Floor plans or an exterior shell.
 * @returns A reusable environment module.
 * @throws Error for malformed plans, unresolved openings or non-upright
 *   placements.
 */
export function createBuilding(
  props: createBuilding.IProps,
): IAutoMovieEnvironmentModule {
  const plan: buildingPlans.IPlan = buildingPlans(props);
  return (
    context: Parameters<IAutoMovieEnvironmentModule>[0],
  ): IAutoMovieEnvironmentContribution => {
    const vertical: IAutoMovieVector3 = Quaternion.rotateVector(
      context.frame.rotation,
      Vector3.create(0, 1, 0),
    );
    if (
      Math.hypot(vertical.x, vertical.y - 1, vertical.z) > 1e-9 ||
      context.frame.scale.x !== 1 ||
      context.frame.scale.y !== 1 ||
      context.frame.scale.z !== 1
    )
      throw new Error(
        `building "${context.id}" requires an upright unit-scale placement`,
      );
    return assembleBuilding(plan, context);
  };
}

/** Inputs specific to the building producer. */
export namespace createBuilding {
  /** One XZ point in local metres. */
  export type Point = readonly [x: number, z: number];

  /** A rectangular region by origin and size, or a simple polygon with holes. */
  export type Footprint =
    | readonly [x: number, z: number, width: number, depth: number]
    | {
        /** Outer footprint ring in XZ metres, without repeating the first point. */
        readonly polygon: readonly Point[];

        /** Independent interior voids, each strictly within the outer ring. */
        readonly holes?: readonly (readonly Point[])[];
      };

  /** A typed opening between two rooms or between a room and the outdoors. */
  export type Opening = {
    /** Unique within this level and distinct from its room IDs. */
    readonly id: string;

    /** Positive Z faces from the first room to the second room or outside. */
    readonly between: readonly [from: string, to: string | null];

    /** Exact XZ wall segment when the room pair identifies multiple walls. */
    readonly edge?: readonly [Point, Point];

    /**
     * Signed offset in metres from the selected wall's centre along its local
     * +X; omitted means centred.
     */
    readonly offset?: number;
  } & (
    | {
        /** Hinged leaf and frame from the existing door producer. */
        readonly kind: "door";

        /**
         * Nominal leaf and hardware choices; this producer owns placement
         * identity and hinge kind.
         */
        readonly door?: Omit<AutoMovieArchetypeDoor.IParams, "id" | "kind">;

        /**
         * Optional swing, in seconds on the compiled shot clock and positive
         * degrees about the door's own hinge.
         */
        readonly swing?: {
          readonly from: number;
          readonly to: number;
          readonly degrees: number;
        };
      }
    | {
        /** Clear aperture with ground at its sill. */
        readonly kind: "passage";
        readonly width: number;
        readonly height: number;
      }
    | {
        /** Air opening above the floor, with no walking threshold. */
        readonly kind: "window";
        readonly width: number;
        readonly height: number;
        readonly sill: number;
      }
  );

  /** One storey with named floor regions and optional wall openings. */
  export interface Level {
    /** Path segment within this building. */
    readonly id: string;

    /**
     * Height of the finished floor above the building origin, in metres.
     * Omission starts at zero or follows the previous level.
     */
    readonly elevation?: number;

    /**
     * Clear height up from the floor, in metres; defaults to 2.8 m for coarse
     * staging.
     */
    readonly height?: number;

    /** Named regions, with at least one room. */
    readonly rooms: Readonly<Record<string, Footprint>>;

    /** Authored openings. Omission leaves walls intact. */
    readonly openings?: readonly Opening[];
  }

  /** One straight interior stair using two adjacent levels and one plan run. */
  export interface Stair {
    /**
     * Path segment for the stair's named supports and link, unique within the
     * building.
     */
    readonly id: string;

    /** Lower level and room, in that order. */
    readonly from: readonly [level: string, room: string];

    /** The next higher level and its receiving room. */
    readonly to: readonly [level: string, room: string];

    /** Centreline endpoints in the building plan, lower first. */
    readonly run: readonly [Point, Point];

    /** Clear tread width across the run, metres. */
    readonly width: number;

    /** Number of equal risers and treads including the upper tread. */
    readonly steps: number;
  }

  /** Building geometry source. */
  export type IProps = {
    /**
     * SRGB exterior and partition swatch, defaulting to a neutral masonry
     * color.
     */
    readonly color?: string;
  } & (
    | {
        /** Levels in bottom-to-top order with nonoverlapping vertical interiors. */
        readonly levels: readonly Level[];

        /**
         * Wall thickness in metres; defaults to 0.15 m, centred on each plan
         * edge.
         */
        readonly wallThickness?: number;

        /** Floor and top-slab thickness in metres; defaults to 0.18 m. */
        readonly slabThickness?: number;

        /**
         * Interior stair runs; their footprints are cut into the adjoining
         * slabs.
         */
        readonly stairs?: readonly Stair[];
      }
    | {
        /** Footprint of an exterior-only mass. */
        readonly footprint: Footprint;

        /** Exterior height in metres. */
        readonly height: number;
      }
  );
}
