import type { IAutoMovieColor } from "../color/IAutoMovieColor";

/** One world-aligned terrain parcel with shared grading, support and appearance. */
export interface IAutoMovieTerrainRecipe {
  /**
   * Width along positive X and depth along positive Z in metres from the module
   * origin. Both are strictly positive.
   */
  size: IAutoMovieTerrainRecipe.Point;

  /** Base relief, defaulting to level at the module origin's height. */
  relief?: IAutoMovieTerrainRecipe.Relief;

  /** Opaque linear ground color, defaulting to an earth-colored swatch. */
  color?: IAutoMovieColor;

  /**
   * Strictly interior, disjoint void rings. The parcel contributes neither
   * surface nor support inside a void.
   */
  holes?: readonly (readonly IAutoMovieTerrainRecipe.Point[])[];

  /**
   * Maximum ground-to-triangle vertical error in metres for sampled ground. The
   * default is 0.01.
   */
  meshTolerance?: number;

  /** Named leveled areas, keyed by stable identifiers. */
  pads?: Readonly<Record<string, IAutoMovieTerrainRecipe.IPad>>;

  /** Named route corridors, keyed by stable identifiers. */
  paths?: Readonly<Record<string, IAutoMovieTerrainRecipe.IPath>>;

  /**
   * Named opaque material inlays. Their interiors are disjoint and the ground
   * remains walkable across their rims.
   */
  regions?: Readonly<Record<string, IAutoMovieTerrainRecipe.IRegion>>;

  /**
   * Named still water features supplying level visible surfaces without walking
   * support.
   */
  water?: Readonly<Record<string, IAutoMovieTerrainRecipe.IWater>>;

  /**
   * Named compact tree populations. Each disk clears pads, paths, holes and
   * water.
   */
  trees?: Readonly<Record<string, IAutoMovieTerrainRecipe.ITrees>>;

  /**
   * Named local points at which to place another item's frame on the finished
   * walkable ground.
   */
  amenities?: Readonly<Record<string, IAutoMovieTerrainRecipe.Point>>;
}

export namespace IAutoMovieTerrainRecipe {
  /**
   * Local X and Z in metres before the terrain's translation to world
   * coordinates.
   */
  export type Point = readonly [number, number];

  /** The base height function before localized grade constraints. */
  export type Relief =
    | {
        /** Level base. */
        kind: "level";
        /**
         * Vertical offset in metres from the module origin. The default is
         * zero.
         */
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
        /**
         * Maximum vertical deviation from the mean in metres, strictly
         * positive.
         */
        amplitude: number;
        /** Distance in metres over which a wave repeats, strictly positive. */
        wavelength: number;
      };

  /** A hard level area with a graded exterior shoulder. */
  export interface IPad {
    /**
     * Simple local XZ outline about the terrain origin or the named frame. The
     * first vertex is not repeated at the end.
     */
    outline: readonly Point[];
    /** Optional environment-relative frame placing and turning the pad in plan. */
    at?: string;
    /**
     * Plateau level as a terrain-local metre offset or an anchor's world Y.
     * Defaults to the placement frame's Y.
     */
    height?: number | { anchor: string };
    /** Grading shoulder width in metres. Defaults to one metre. */
    shoulder?: number;
    /**
     * Cut the level footprint out of the terrain when a structure supplies the
     * floor there.
     */
    cut?: boolean;
  }

  /** A corridor graded along an ordered polyline. */
  export interface IPath {
    /**
     * At least two successive distinct local plan points or
     * environment-relative named anchors.
     */
    points: readonly (Point | { anchor: string })[];
    /**
     * Full supported corridor width in metres, strictly positive. A terminal
     * cross-section may meet an adjacent landing.
     */
    width: number;
    /** Side grading shoulder in metres, defaulting to half the width. */
    shoulder?: number;
    /**
     * Maximum absolute rise per horizontal metre along the centerline. Omission
     * imposes no slope limit.
     */
    maxSlope?: number;
  }

  /** An opaque inlay sharing the surrounding terrain's height. */
  export interface IRegion {
    /**
     * Strictly interior local XZ outline. The adjoining parcel uses this same
     * ring.
     */
    outline: readonly Point[];
    /** Opaque linear RGB applied to the inlay's tessellation. */
    color: IAutoMovieColor;
  }

  /** A still, bounded water feature with a level shore. */
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

  /** One bounded, terrain-following disk of repeated tree decoration. */
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
