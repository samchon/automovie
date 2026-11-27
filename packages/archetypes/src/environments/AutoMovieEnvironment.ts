import { type IAutoMovieEnvironment, type IAutoMovieEnvironmentRecipe, type IAutoMovieEnvironmentModule, type IAutoMovieEnvironmentModel, type IAutoMovieTerrainRecipe } from "@automovie/interface";
import type { AutoMovieArchetypeDoor } from "../architecture/AutoMovieArchetypeDoor";
import { createEnvironment as createEnvironmentImplementation } from "./internal/createEnvironment";
import { environmentModel as environmentModelImplementation } from "./internal/environmentModel";
import { createBuilding as createBuildingImplementation } from "./buildings/createBuilding";
import { createTerrain as createTerrainImplementation } from "./terrain/internal/createTerrain";

/** Public operations for Auto Movie Environment. */
export namespace AutoMovieEnvironment {
  /**
   * Place typed modules and prepare the stage and runtime pieces a shot uses.
   *
   * Item keys are stable within the recipe. References address an item's origin
   * or its named anchors. Each module is evaluated once after its inputs resolve.
   * Emitted arrays keep source item order even when a reference is forward.
   *
   * @param recipe Named items, optional seed and optional rigid world frame.
   * @returns The stage set and space, compile runtime records, architectural
   *   records, named world frames and the support of every set piece, judged
   *   against the merged space, the other pieces, the walls furnishing relations
   *   hung pieces on and each building's own sweep at its placement height.
   * @throws For malformed identity or placement, missing or cyclic references,
   *   conflicting emitted identities or invalid support or prop declarations.
   */
  export function create(recipe: IAutoMovieEnvironmentRecipe): IAutoMovieEnvironment {
    return createEnvironmentImplementation(recipe);
  }

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
  export function building(props: Building.IProps): IAutoMovieEnvironmentModule {
    return createBuildingImplementation(props);
  }

  /**
   * Offer a supplied model as a reusable environment module.
   *
   * @param input Model and optional locally authored anchors, support and prop
   *   facts.
   * @returns A definition that places those records in the scope and frame
   *   assigned by the composer.
   */
  export function model(input: IAutoMovieEnvironmentModel): IAutoMovieEnvironmentModule {
    return environmentModelImplementation(input);
  }

  /**
   * Create a world-aligned terrain module with named placement and route frames.
   *
   * The module origin is its southwest plan corner. Resolve building elevations
   * independently before placing pads or paths at those building frames. The
   * returned support surfaces and world pieces use the same heights and area.
   * Material regions replace the parent patch within their footprints. A cut
   * excludes ground in both outputs, and still water uses its own nonwalkable
   * patch. An optional tree disk produces a compact instance recipe, and an
   * optional wood an explicit one whose trees each clear those features.
   *
   * @param recipe Extent, optional relief and features in module-local metres.
   * @returns A definition to place in a composed environment.
   */
  export function terrain(recipe: IAutoMovieTerrainRecipe): IAutoMovieEnvironmentModule {
    return createTerrainImplementation(recipe);
  }

  /** Inputs specific to the building producer. */
  export namespace Building {
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
}
