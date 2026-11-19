import type { IAutoMovieColor } from "../color/IAutoMovieColor";

/**
 * One world-aligned terrain parcel with shared grading, support and appearance.
 *
 * @evidence contracts/development/design.md#principled-representation Bounded local XZ metre geometry and relative height share the placed module origin. A closed relief union describes the base, and named pads and paths supply geometry or anchor references for grading. The producer admits dimensions, topology and conflicts at build time.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The author states an extent, optional relief and only the features the parcel needs. Existing surface, route and population records carry the result. Internal tessellation and sample counts are derived.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The producer refuses a rotated parcel so a stored XZ lattice keeps its world frame. Topology, resolved anchors, representable coordinates and the mesh error limit are checked when the module runs.
 * @evidence contracts/development/common.md#meaningful-documentation States the coordinate frame, units, defaults and opacity, hard grade sources, holes, variable relief and bounded tessellation error.
 */
export interface IAutoMovieTerrainRecipe {
  /** Width along positive X and depth along positive Z in metres from the module origin. Both are strictly positive. */
  size: IAutoMovieTerrainRecipe.Point;

  /** Base relief, defaulting to level at the module origin's height. */
  relief?: IAutoMovieTerrainRecipe.Relief;

  /** Opaque linear ground color, defaulting to an earth-colored swatch. */
  color?: IAutoMovieColor;

  /** Strictly interior, disjoint void rings. The parcel contributes neither surface nor support inside a void. */
  holes?: readonly (readonly IAutoMovieTerrainRecipe.Point[])[];

  /** Maximum ground-to-triangle vertical error in metres for sampled ground. The default is 0.01. */
  meshTolerance?: number;

  /** Named leveled areas, keyed by stable identifiers. */
  pads?: Readonly<Record<string, IAutoMovieTerrainRecipe.IPad>>;

  /** Named route corridors, keyed by stable identifiers. */
  paths?: Readonly<Record<string, IAutoMovieTerrainRecipe.IPath>>;

  /** Named opaque material inlays. Their interiors are disjoint and the ground remains walkable across their rims. */
  regions?: Readonly<Record<string, IAutoMovieTerrainRecipe.IRegion>>;

  /** Named still water features supplying level visible surfaces without walking support. */
  water?: Readonly<Record<string, IAutoMovieTerrainRecipe.IWater>>;

  /** Named compact tree populations. Each disk clears pads, paths, holes and water. */
  trees?: Readonly<Record<string, IAutoMovieTerrainRecipe.ITrees>>;

  /** Named local points at which to place another item's frame on the finished walkable ground. */
  amenities?: Readonly<Record<string, IAutoMovieTerrainRecipe.Point>>;
}

export namespace IAutoMovieTerrainRecipe {
  /**
   * Local X and Z in metres before the terrain's translation to world coordinates.
   *
   * @evidence contracts/development/design.md#principled-representation A fixed two-number tuple excludes missing or extra plan axes. The producer checks finiteness and bounds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Shares one plan spelling for the parcel's size, points, outlines and slope axes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Grade tuples document their dimensionless interpretation at their field. Geometry points retain metre units.
   * @evidence contracts/development/common.md#meaningful-documentation Names axis order, frame and units.
   */
  export type Point = readonly [number, number];

  /**
   * The base height function before localized grade constraints.
   *
   * @evidence contracts/development/design.md#principled-representation Three closed variants select a constant, planar grade or bounded waves. Stored heights and wavelength are metres, with grades in metres of rise per metre in their local axis.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Preserves constant and plane rules without allocating a lattice when no grade constraints exist. Rolling ground needs amplitude and wavelength to express spatial size independently of extent.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No shape-dependent parameter is shared across meaningless variants. The producer checks finite values, positive wavelength and representable sampling.
   * @evidence contracts/development/common.md#meaningful-documentation Defines variants, local height datum, grade axes, amplitude, wavelength and omitted height.
   */
  export type Relief =
    | {
        /** Level base. */
        kind: "level";
        /** Vertical offset in metres from the module origin. The default is zero. */
        height?: number;
      }
    | {
        /** Constant grade on the two plan axes. */
        kind: "plane";
        /** Vertical offset in metres at the module origin. The default is zero. */
        height?: number;
        /** Rise per metre in positive X and Z, respectively. */
        slope: Point;
      }
    | {
        /** Bounded seeded waves around a mean height. */
        kind: "rolling";
        /** Mean offset in metres from the module origin. The default is zero. */
        height?: number;
        /** Maximum vertical deviation from the mean in metres, strictly positive. */
        amplitude: number;
        /** Distance in metres over which a wave repeats, strictly positive. */
        wavelength: number;
      };

  /**
   * A hard level area with a graded exterior shoulder.
   *
   * @evidence contracts/development/design.md#principled-representation A local simple plan ring and one explicit local height or named world anchor define a plateau. Equal grade constraints can overlap. Shoulders are positive widths in metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the pad supplies its plan geometry and vertical authority. Paths and terrain consume that result.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An anchor supplies the level of an independently placed occurrence. The resolver refuses cyclic dependencies and the terrain producer names incompatible levels.
   * @evidence contracts/development/common.md#meaningful-documentation Gives polygon form, the height datum and the default shoulder.
   */
  export interface IPad {
    /** Simple local XZ outline about the terrain origin or the named frame. The first vertex is not repeated at the end. */
    outline: readonly Point[];
    /** Optional environment-relative frame placing and turning the pad in plan. */
    at?: string;
    /** Plateau level as a terrain-local metre offset or an anchor's world Y. Defaults to the placement frame's Y. */
    height?: number | { anchor: string };
    /** Grading shoulder width in metres. Defaults to one metre. */
    shoulder?: number;
    /** Cut the level footprint out of the terrain when a structure supplies the floor there. */
    cut?: boolean;
  }

  /**
   * A corridor graded along an ordered polyline.
   *
   * @evidence contracts/development/design.md#principled-representation Local XZ points take their elevation from the base ground or an intersecting pad. A named frame provides an exact world point and elevation. Width and shoulders use metres, with unsigned maximum slope in metres per metre.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The resolved path feeds the world route and the grade function. Stable start and end anchors expose the finished approach to consumers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The producer checks finite coordinates, full segment and turn clearance, usable segment lengths and any maximum slope. A missing anchor has no fallback.
   * @evidence contracts/development/common.md#meaningful-documentation Gives point variants, width, shoulder default and optional grade limit.
   */
  export interface IPath {
    /** At least two successive distinct local plan points or environment-relative named anchors. */
    points: readonly (Point | { anchor: string })[];
    /** Full supported corridor width in metres, strictly positive. A terminal cross-section may meet an adjacent landing. */
    width: number;
    /** Side grading shoulder in metres, defaulting to half the width. */
    shoulder?: number;
    /** Maximum absolute rise per horizontal metre along the centerline. Omission imposes no slope limit. */
    maxSlope?: number;
  }

  /**
   * An opaque inlay sharing the surrounding terrain's height.
   *
   * @evidence contracts/development/design.md#principled-representation A simple local plan ring determines the material footprint and an admitted opaque linear RGB color determines its appearance.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The inlay reuses the parcel's height and supplies only the outline and color.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The producer requires inlays to be strictly interior and disjoint. Their shared rims use one height rule.
   * @evidence contracts/development/common.md#meaningful-documentation Gives the local outline's topology and how color and height are owned.
   */
  export interface IRegion {
    /** Strictly interior local XZ outline. The adjoining parcel uses this same ring. */
    outline: readonly Point[];
    /** Opaque linear RGB applied to the inlay's tessellation. */
    color: IAutoMovieColor;
  }

  /**
   * A still, bounded water feature with a level shore.
   *
   * @evidence contracts/development/design.md#principled-representation The same ring in local XZ defines the water, surrounding terrain cut and level grade constraint. Height is an offset in metres from the module origin.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Reuses normal surface material and nonwalkable membership without introducing fluid simulation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The producer refuses intersecting inlay and void rings. The water provides a visible surface without granting walking support.
   * @evidence contracts/development/common.md#meaningful-documentation Gives ring, level, color, shoulder and support semantics.
   */
  export interface IWater {
    /** Strictly interior local XZ outline. */
    outline: readonly Point[];
    /** Water level in metres above the module origin. */
    height: number;
    /** Opaque linear RGB, defaulting to a muted blue swatch. */
    color?: IAutoMovieColor;
    /** Grading shoulder in metres, defaulting to one metre. */
    shoulder?: number;
  }

  /**
   * One bounded, terrain-following disk of repeated tree decoration.
   *
   * @evidence contracts/development/design.md#principled-representation Center and radius define a local metre disk, count selects an integer population and a dimensionless scale sizes one shared tree prototype.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The authored disk guarantees compact uniformly scattered placement without a per-tree input list or per-seed rejection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The producer refuses disks whose trunks can reach a protected region. A separate amenity provides named interaction.
   * @evidence contracts/development/common.md#meaningful-documentation States the disk geometry, count bounds and visual scale.
   */
  export interface ITrees {
    /** Local XZ disk center. */
    center: Point;
    /** Strictly positive disk radius in metres. */
    radius: number;
    /** Integer count from one to 100,000. */
    count: number;
    /** Positive scale for the shared tree silhouette. The default is one. */
    scale?: number;
  }
}
