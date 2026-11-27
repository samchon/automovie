import {
  type IAutoMovieEnvironment,
  type IAutoMovieEnvironmentModel,
  type IAutoMovieEnvironmentModule,
  type IAutoMovieEnvironmentRecipe,
  type IAutoMovieMotionHumanSupportTransfer,
  type IAutoMovieTerrainRecipe,
} from "@automovie/interface";

import type { AutoMovieArchetypeDoor } from "../architecture/AutoMovieArchetypeDoor";
import type { AutoMovieArchetypeElevator } from "../architecture/AutoMovieArchetypeElevator";
import { createBuilding as createBuildingImplementation } from "./buildings/createBuilding";
import { createPassage as createPassageImplementation } from "./buildings/createPassage";
import { createEnvironment as createEnvironmentImplementation } from "./internal/createEnvironment";
import { environmentModel as environmentModelImplementation } from "./internal/environmentModel";
import { createLift as createLiftImplementation } from "./lifts/createLift";
import { createTerrain as createTerrainImplementation } from "./terrain/internal/createTerrain";

/** Public operations for Auto Movie Environment. */
export namespace AutoMovieEnvironment {
  /** One XZ point in local metres. */
  export type IAutoMovieEnvironmentBuildingPoint = readonly [
    x: number,
    z: number,
  ];

  /** A rectangular building footprint by origin and size. */
  export type IAutoMovieEnvironmentBuildingRectangleFootprint = readonly [
    x: number,
    z: number,
    width: number,
    depth: number,
  ];

  /** A simple polygonal building footprint with independent holes. */
  export interface IAutoMovieEnvironmentBuildingPolygonFootprint {
    /** Outer footprint ring in XZ metres, without repeating the first point. */
    readonly polygon: readonly IAutoMovieEnvironmentBuildingPoint[];
    /** Independent interior voids, each strictly within the outer ring. */
    readonly holes?: readonly (readonly IAutoMovieEnvironmentBuildingPoint[])[];
  }

  /** A rectangular region or a simple polygon with holes. */
  export type IAutoMovieEnvironmentBuildingFootprint =
    | IAutoMovieEnvironmentBuildingRectangleFootprint
    | IAutoMovieEnvironmentBuildingPolygonFootprint;

  /** Shared fields for an opening between rooms or to the outdoors. */
  export interface IAutoMovieEnvironmentBuildingOpeningBase {
    /** Unique within this level and distinct from its room IDs. */
    readonly id: string;
    /** Positive Z faces from the first room to the second room or outside. */
    readonly between: readonly [from: string, to: string | null];
    /** Exact XZ wall segment when the room pair identifies multiple walls. */
    readonly edge?: readonly [
      IAutoMovieEnvironmentBuildingPoint,
      IAutoMovieEnvironmentBuildingPoint,
    ];
    /**
     * Signed offset in metres from the selected wall's centre along its local
     * +X; omitted means centred.
     */
    readonly offset?: number;
  }

  /** Hinged leaf and frame from the existing door producer. */
  export interface IAutoMovieEnvironmentBuildingDoorOpening extends IAutoMovieEnvironmentBuildingOpeningBase {
    readonly kind: "door";
    /**
     * Nominal leaf and hardware choices; this producer owns placement identity
     * and hinge kind.
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

  /** Clear aperture with ground at its sill. */
  export interface IAutoMovieEnvironmentBuildingPassageOpening extends IAutoMovieEnvironmentBuildingOpeningBase {
    readonly kind: "passage";
    readonly width: number;
    readonly height: number;
  }

  /** Air opening above the floor, with no walking threshold. */
  export interface IAutoMovieEnvironmentBuildingWindowOpening extends IAutoMovieEnvironmentBuildingOpeningBase {
    readonly kind: "window";
    readonly width: number;
    readonly height: number;
    readonly sill: number;
  }

  /** A typed door, clear passage or window opening. */
  export type IAutoMovieEnvironmentBuildingOpening =
    | IAutoMovieEnvironmentBuildingDoorOpening
    | IAutoMovieEnvironmentBuildingPassageOpening
    | IAutoMovieEnvironmentBuildingWindowOpening;

  /** One storey with named floor regions and optional wall openings. */
  export interface IAutoMovieEnvironmentBuildingLevel {
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
    readonly rooms: Readonly<
      Record<string, IAutoMovieEnvironmentBuildingFootprint>
    >;

    /** Authored openings. Omission leaves walls intact. */
    readonly openings?: readonly IAutoMovieEnvironmentBuildingOpening[];
  }

  /** One straight interior stair using two adjacent levels and one plan run. */
  export interface IAutoMovieEnvironmentBuildingStair {
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
    readonly run: readonly [
      IAutoMovieEnvironmentBuildingPoint,
      IAutoMovieEnvironmentBuildingPoint,
    ];

    /** Clear tread width across the run, metres. */
    readonly width: number;

    /** Number of equal risers and treads including the upper tread. */
    readonly steps: number;
  }

  /** Shared appearance for either building geometry source. */
  export interface IAutoMovieEnvironmentBuildingPropsBase {
    /**
     * SRGB exterior and partition swatch, defaulting to a neutral masonry
     * color.
     */
    readonly color?: string;
  }

  /** A building defined by levels, rooms and optional interior stair runs. */
  export interface IAutoMovieEnvironmentBuildingLevelPlanProps extends IAutoMovieEnvironmentBuildingPropsBase {
    readonly type: "levels";
    /** Levels in bottom-to-top order with nonoverlapping vertical interiors. */
    readonly levels: readonly IAutoMovieEnvironmentBuildingLevel[];
    /** Wall thickness in metres; defaults to 0.15 m, centred on each plan edge. */
    readonly wallThickness?: number;
    /** Floor and top-slab thickness in metres; defaults to 0.18 m. */
    readonly slabThickness?: number;
    /** Interior stair runs; their footprints are cut into the adjoining slabs. */
    readonly stairs?: readonly IAutoMovieEnvironmentBuildingStair[];
  }

  /** An exterior-only building mass. */
  export interface IAutoMovieEnvironmentBuildingExteriorProps extends IAutoMovieEnvironmentBuildingPropsBase {
    readonly type: "exterior";
    /** Footprint of an exterior-only mass. */
    readonly footprint: IAutoMovieEnvironmentBuildingFootprint;
    /** Exterior height in metres. */
    readonly height: number;
  }

  /** Building geometry source: level plans or an exterior-only mass. */
  export type IAutoMovieEnvironmentBuildingProps =
    | IAutoMovieEnvironmentBuildingLevelPlanProps
    | IAutoMovieEnvironmentBuildingExteriorProps;

  /**
   * The sill height relative to the module, or a named world sill to align.
   * Numeric heights use metres. A referenced sill must lie on the shaft axis
   * with the same upright orientation and landing direction.
   */
  /** A named world sill to align to. */
  export interface IAutoMovieEnvironmentLiftAnchorStop {
    anchor: string;
  }

  /** A local metre height or a named world sill constraint. */
  export type IAutoMovieEnvironmentLiftStop =
    | number
    | IAutoMovieEnvironmentLiftAnchorStop;

  /**
   * One commanded stopped position at a full door state, on the shot clock. The
   * doors stay closed while the cab travels between stops. At one stop the cab
   * stays still and the doors interpolate between the keyed states.
   */
  export interface IAutoMovieEnvironmentLiftKey {
    /** Finite shot-local second, strictly increasing from zero. */
    seconds: number;

    /** Key of the sill the cab reaches at this second. */
    stop: string;

    /** The two door layers' state at this second. */
    doors: "closed" | "open";
  }

  /**
   * Authorable shaft and schedule settings. The stock car determines the
   * aperture for both door layers. Adjacent sills must be farther apart than
   * the door height for their openings to fit.
   */
  export interface IAutoMovieEnvironmentLiftProps {
    /**
     * At least two named local-height or anchor constraints on one vertical
     * shaft.
     */
    stops: Readonly<Record<string, IAutoMovieEnvironmentLiftStop>>;

    /** At least two keys from time zero, in strictly increasing seconds. */
    schedule: readonly IAutoMovieEnvironmentLiftKey[];

    /**
     * Metres between the cab floor edge and the fixed landing edge, greater
     * than the cab leaf depth.
     */
    gap: number;

    /** Positive landing floor depth beyond its edge, metres along local +Z. */
    landingDepth: number;

    /** The catalogue car choices. The composer owns the instance id. */
    car?: Omit<AutoMovieArchetypeElevator.IParams, "id">;
  }

  /**
   * A prop surface selector of the support-transfer grammar: a prop subject id
   * and its surface affordance id.
   */
  export type IAutoMovieEnvironmentLiftSurface =
    IAutoMovieMotionHumanSupportTransfer.ISurface;

  /**
   * The foot, duration and destination station a crossing hands to the
   * support-transfer grammar unchanged.
   */
  export type IAutoMovieEnvironmentLiftTiming = Pick<
    IAutoMovieMotionHumanSupportTransfer,
    "lead" | "seconds" | "landing"
  >;

  /**
   * The support-transfer input `transfer` returns: both surfaces plus the
   * crossing's foot, duration and station. Docking is left at its stationary
   * default.
   */
  export type IAutoMovieEnvironmentLiftTransfer = Pick<
    IAutoMovieMotionHumanSupportTransfer,
    "from" | "to" | "lead" | "seconds" | "landing"
  >;

  /**
   * One shot-local transfer between the named landing and cab surfaces. The
   * stop and time select a docked window. The leading foot and optional
   * destination-surface coordinates use the existing support-transfer grammar.
   */
  export interface IAutoMovieEnvironmentLiftCrossing extends IAutoMovieEnvironmentLiftTiming {
    /** Scoped id of the placed lift module, including the environment name. */
    id: string;

    /** Name of the landing to cross. */
    stop: string;

    /** Whether the landing or cab supplies the entry support. */
    direction: "board" | "exit";

    /** Shot-local second at which this stationary transfer starts. */
    start: number;
  }

  /**
   * A reusable callable lift module with a boarding admission query. The same
   * schedule drives the placed lift and checks timing for a crossing of any
   * occurrence. The support-transfer law checks the actor's motion.
   */
  export interface IAutoMovieEnvironmentLiftDefinition extends IAutoMovieEnvironmentModule {
    /**
     * Turn an authored crossing into an existing support-transfer input.
     *
     * @param crossing The occurrence, stop, direction and planned interval.
     * @returns The two support selectors and existing transfer parameters.
     * @throws When the known stop is not open and docked during that interval.
     */
    transfer(
      crossing: IAutoMovieEnvironmentLiftCrossing,
    ): IAutoMovieEnvironmentLiftTransfer;
  }

  /** A generated opening anchor carrying clear section frames. */
  export interface IAutoMovieEnvironmentPassageOpeningEndpoint {
    /** Scoped opening anchor carrying generated clear section frames. */
    readonly opening: string;
  }

  /** A plain scenic anchor or a generated opening with a clear section. */
  export type IAutoMovieEnvironmentPassageEndpoint =
    | string
    | IAutoMovieEnvironmentPassageOpeningEndpoint;

  /** Shared connection geometry between two scoped world anchors. */
  export interface IAutoMovieEnvironmentPassagePropsBase {
    /** First world anchor, in centreline position at its landing surface. */
    readonly from: IAutoMovieEnvironmentPassageEndpoint;
    /** Second world anchor, in centreline position at its landing surface. */
    readonly to: IAutoMovieEnvironmentPassageEndpoint;
    /** Full clear deck width, in metres. */
    readonly width: number;
    /** Required headroom in metres at a fitted opening, when stated. */
    readonly clearHeight?: number;
    /** Vertical thickness of suspended spans, in metres. Defaults to 0.18 m. */
    readonly thickness?: number;
    /** SRGB finish swatch, with neutral stone by default. */
    readonly color?: string;
  }

  /** A level bridge span. */
  export interface IAutoMovieEnvironmentPassageBridgeProps extends IAutoMovieEnvironmentPassagePropsBase {
    readonly kind: "bridge";
  }

  /** A ramp span with an optional maximum slope. */
  export interface IAutoMovieEnvironmentPassageRampProps extends IAutoMovieEnvironmentPassagePropsBase {
    readonly kind: "ramp";
    /** Optional maximum absolute rise divided by horizontal run. */
    readonly maximumSlope?: number;
  }

  /** A stair span with a fixed number of equal rises and treads. */
  export interface IAutoMovieEnvironmentPassageStairsProps extends IAutoMovieEnvironmentPassagePropsBase {
    readonly kind: "stairs";
    /** Number of equal rises and treads, including the top tread. */
    readonly steps: number;
  }

  /** Static span construction choices specific to the passage producer. */
  export type IAutoMovieEnvironmentPassageProps =
    | IAutoMovieEnvironmentPassageBridgeProps
    | IAutoMovieEnvironmentPassageRampProps
    | IAutoMovieEnvironmentPassageStairsProps;

  /**
   * Place typed modules and prepare the stage and runtime pieces a shot uses.
   *
   * Item keys are stable within the recipe. References address an item's origin
   * or its named anchors. Each module is evaluated once after its inputs
   * resolve. Emitted arrays keep source item order even when a reference is
   * forward.
   *
   * @param recipe Named items, optional seed and optional rigid world frame.
   * @returns The stage set and space, compile runtime records, architectural
   *   records, named world frames and the support of every set piece, judged
   *   against the merged space, the other pieces, the walls furnishing
   *   relations hung pieces on and each building's own sweep at its placement
   *   height.
   * @throws For malformed identity or placement, missing or cyclic references,
   *   conflicting emitted identities or invalid support or prop declarations.
   */
  export function create(
    recipe: IAutoMovieEnvironmentRecipe,
  ): IAutoMovieEnvironment {
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
  export function building(
    props: Building.IProps,
  ): IAutoMovieEnvironmentModule {
    return createBuildingImplementation(props);
  }

  /**
   * Define a lift whose cab, door panels and stopped landings can be staged
   * together by `createEnvironment`. Local +Y is up and +Z points out of the
   * cab. The module exports `<stop>` at the sill, `<stop>/approach` at the
   * landing's outer edge and `<stop>/call` on the fixed button. The cab and
   * landing are ordinary props with `floor` and aperture-width `sill`
   * affordances. Their existing motion-transfer inputs come from `transfer` for
   * a checked open interval.
   *
   * @param input Lift geometry, named stops and timeline in shot-local seconds.
   * @returns A reusable environment definition and its boarding query.
   * @throws If the timeline is invalid, or on placement if the stops or shaft
   *   are not aligned.
   */
  export function lift(input: Lift.IProps): Lift.IDefinition {
    return createLiftImplementation(input);
  }

  /**
   * Span named landing frames with a bridge, ramp or flight of stairs.
   *
   * The landing locations give the route direction and run. Adjacent flights
   * can join a shared intermediate landing, and a bridge can connect distinct
   * buildings. A constant or planar support patch per slab or step uses the
   * same upper face as its visible geometry.
   *
   * A fitted opening requires a normal approach to its clear section.
   *
   * @param props Named endpoints and the connector's physical dimensions.
   * @returns A placed environment module supplying geometry, support and route.
   * @throws Error for missing anchors, incompatible landing heights, an oblique
   *   fitted opening or invalid flight dimensions.
   */
  export function passage(props: Passage.IProps): IAutoMovieEnvironmentModule {
    return createPassageImplementation(props);
  }

  /**
   * Offer a supplied model as a reusable environment module.
   *
   * @param input Model and optional locally authored anchors, support and prop
   *   facts.
   * @returns A definition that places those records in the scope and frame
   *   assigned by the composer.
   */
  export function model(
    input: IAutoMovieEnvironmentModel,
  ): IAutoMovieEnvironmentModule {
    return environmentModelImplementation(input);
  }

  /**
   * Create a world-aligned terrain module with named placement and route
   * frames.
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
  export function terrain(
    recipe: IAutoMovieTerrainRecipe,
  ): IAutoMovieEnvironmentModule {
    return createTerrainImplementation(recipe);
  }

  /** Inputs specific to the building producer. */

  /**
   * The lift definition's authorable geometry, stop clock and crossing
   * contracts.
   */

  /** Static span construction choices specific to the passage producer. */
}
