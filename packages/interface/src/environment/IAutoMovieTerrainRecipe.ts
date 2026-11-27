import type { IAutoMovieColor } from "../color/IAutoMovieColor";

/** One world-aligned terrain parcel with shared grading, support and appearance. */
export interface IAutoMovieTerrainRecipe {
  /**
   * Width along positive X and depth along positive Z in metres from the module
   * origin. Both are strictly positive.
   */
  size: IAutoMovieTerrainRecipe.ISize;

  /** Base relief, defaulting to level at the module origin's height. */
  relief?: IAutoMovieTerrainRecipe.Relief;

  /** Opaque linear ground color, defaulting to an earth-colored swatch. */
  color?: IAutoMovieColor;

  /**
   * Strictly interior, disjoint void rings. The parcel contributes neither
   * surface nor support inside a void.
   */
  holes?: readonly (readonly IAutoMovieTerrainRecipe.IXzPoint[])[];

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
   * Named woods planted over an outline, keyed by stable identifiers. Unlike a
   * tree disk, a wood removes only the trees whose trunks would reach a pad,
   * path, hole or water, so a trail may cross it.
   */
  woods?: Readonly<Record<string, IAutoMovieTerrainRecipe.IWoods>>;

  /**
   * Named local points at which to place another item's frame on the finished
   * walkable ground.
   */
  amenities?: Readonly<Record<string, IAutoMovieTerrainRecipe.IXzPoint>>;
}

export namespace IAutoMovieTerrainRecipe {
  /**
   * Positive parcel dimensions along world X and Z, in metres.
   */
  export interface ISize {
    /** Width along positive X. */
    readonly width: number;
    /** Depth along positive Z. */
    readonly depth: number;
  }

  /** Rise per metre along each positive plan axis. */
  export interface ISlope {
    /** Vertical rise per horizontal metre along positive X. */
    readonly risePerX: number;
    /** Vertical rise per horizontal metre along positive Z. */
    readonly risePerZ: number;
  }

  /** Local X and Z in metres before the terrain's translation to world coordinates. */
  export interface IXzPoint {
    /** Local coordinate along positive X. */
    readonly x: number;
    /** Local coordinate along positive Z. */
    readonly z: number;
  }

  /** A reference to a named environment frame. */
  export interface IAnchorPoint {
    /** Environment-relative frame name. */
    readonly anchor: string;
  }

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
        slope: ISlope;
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
      }
    | {
        /**
         * Seeded fractal gradient noise around a mean height, which does not
         * repeat. The terrain module samples the engine's two-dimensional
         * fractal noise at local plan coordinates divided by `wavelength`,
         * seeded from the environment seed and the id `"terrain"`.
         */
        kind: "noise";
        /** Mean offset in metres from the module origin. The default is zero. */
        height?: number;
        /**
         * Greatest vertical deviation from the mean in metres, strictly
         * positive. The ground stays within the mean plus or minus this.
         */
        amplitude: number;
        /**
         * Wavelength of the first, coarsest octave in metres, strictly
         * positive.
         */
        wavelength: number;
        /**
         * Number of octaves, an integer from 1 to 8; each halves the previous
         * wavelength. The default is 4. More octaves add finer detail and need
         * a finer height lattice.
         */
        octaves?: number;
        /**
         * Amplitude ratio between successive octaves, strictly between 0 and 1.
         * The default is 0.5.
         */
        roughness?: number;
      };

  /** A hard level area with a graded exterior shoulder. */
  export interface IPad {
    /**
     * Simple local XZ outline about the terrain origin or the named frame. The
     * first vertex is not repeated at the end.
     */
    outline: readonly IXzPoint[];
    /** Optional environment-relative frame placing and turning the pad in plan. */
    at?: string;
    /**
     * Plateau level as a terrain-local metre offset or an anchor's world Y.
     * Defaults to the placement frame's Y.
     */
    height?: number | IAnchorPoint;
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
    points: readonly (IXzPoint | IAnchorPoint)[];
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
    outline: readonly IXzPoint[];
    /** Opaque linear RGB applied to the inlay's tessellation. */
    color: IAutoMovieColor;
  }

  /** A still, bounded water feature with a level shore. */
  export interface IWater {
    /** Strictly interior local XZ outline. */
    outline: readonly IXzPoint[];
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
    center: IXzPoint;
    /** Strictly positive disk radius in metres. */
    radius: number;
    /** Integer count from one to 100,000. */
    count: number;
    /** Positive scale for the shared tree silhouette. The default is one. */
    scale?: number;
  }

  /**
   * A terrain-following wood planted over an outline by jittered grid sampling.
   *
   * The terrain module lays cells of side `1.5 * spacing` over the outline and
   * jitters one site in each inside a centred square of side `0.5 * spacing`,
   * so no two trunks stand closer than `spacing`. It keeps a site only when the
   * site lies inside `outline`, its trunk disk lies on parcel land, and the
   * disk reaches no pad, path, hole or water. Jitter, species and order are
   * drawn from the environment seed and the wood's name.
   */
  export interface IWoods {
    /**
     * Simple local XZ ring strictly inside the parcel. The first vertex is not
     * repeated at the end.
     */
    outline: readonly IXzPoint[];

    /** Least trunk-to-trunk distance in metres, strictly positive. */
    spacing: number;

    /**
     * Integer number of trees from 1 to 100,000, kept as the first accepted
     * sites in seeded order. Omission plants every accepted site. A count above
     * the accepted sites is refused with the number that fit.
     */
    count?: number;

    /**
     * Positive selection weights by species. The default is `{ whiteOak: 1 }`.
     * The clearance test uses the largest trunk among the weighted species.
     */
    species?: Readonly<Partial<Record<"whiteOak" | "douglasFir", number>>>;

    /** Positive scale for every tree silhouette. The default is one. */
    scale?: number;
  }
}
