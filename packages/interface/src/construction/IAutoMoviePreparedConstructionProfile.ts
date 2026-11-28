import type { IAutoMovieConstructionProfile } from "./IAutoMovieConstructionProfile";
import type { IAutoMovieConstructionProfilePhase } from "./IAutoMovieConstructionProfilePhase";
import type { IAutoMovieSolidAtlas } from "./IAutoMovieSolidAtlas";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** Source-backed profile queries retained after declaration admission. */
export namespace IAutoMoviePreparedConstructionProfile {
  /**
   * Original profile definition and its retained atlas, source charts and
   * readers. Preserve the exposed declaration, maps, atlas and underlying
   * functions while those readers use them. Preparation owns a copy of the
   * declaration and borrows the live geometry inputs.
   */
  export interface IPrepared {
    /**
     * Detached copy of the admitted pure declaration. Prepare a new source
     * after changing one of its dependencies.
     */
    definition: IAutoMovieConstructionProfile;

    /**
     * Retained piece charts in loop and piece order. Boundary traversal maps an
     * open chart side to the appropriate neighboring piece after checking its
     * actual shared endpoint. Nonfinite chart coordinates have no retained
     * membership or neighbor.
     */
    atlas: IAutoMovieSolidAtlas;

    /** Piece ID to the same retained surface stored at that piece's atlas index. */
    surfaces: ReadonlyMap<string, IAutoMovieSolidSurface>;

    /**
     * Piece-keyed surface wrappers over the original functions and their full
     * supported station intervals before retained clipping.
     */
    originals: ReadonlyMap<string, IAutoMovieSolidSurface>;

    /**
     * Read the active loop IDs in declaration order at a finite physical
     * millimetre station. The reader checks each adjacent endpoint pair there.
     * A nonfinite or outside station, unavailable loop or failed endpoint
     * comparison throws.
     */
    section(station: number): readonly string[];

    /**
     * Read world value and phase derivatives for the named piece at a finite
     * physical millimetre station and normalized coordinate in [0, 1]. Failure
     * to resolve the chart or its first phase derivative throws, as do
     * nonfinite operands or world results. Second phase derivative can be
     * null.
     */
    phase(
      piece: string,
      station: number,
      coordinate: number,
    ): IAutoMovieConstructionProfilePhase.IReading;

    /**
     * Check a region and piece at a finite millimetre station and normalized
     * piece coordinate in [0, 1]. Unknown IDs throw. A known chart outside the
     * region or with a nonfinite coordinate returns false. A resolved trim
     * receives the original clock.
     */
    contains(
      region: string,
      piece: string,
      station: number,
      coordinate: number,
    ): boolean;
  }
}
