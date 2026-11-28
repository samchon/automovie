import type { IAutoMovieConstructionKnownPort } from "./IAutoMovieConstructionKnownPort";
import type { IAutoMovieConstructionKnownPortSide } from "./IAutoMovieConstructionKnownPortSide";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** Prepared original-field port surface and the neighboring owners it retains. */
export namespace IAutoMoviePreparedConstructionKnownPort {
  /**
   * Original-field band surface whose chart uses transverse u in [0, 1] and
   * original clock v. An authored period applies to v. Positions use world
   * millimetres. Preserve its borrowed field and map owners throughout its
   * lifetime.
   */
  export interface IPrepared extends IAutoMovieSolidSurface {
    /**
     * Detached copy of the original band declaration, keeping the authored
     * clock and outward sign.
     */
    definition: IAutoMovieConstructionKnownPort;

    /** Original field and map owners selected for the two boundaries. */
    rails: IPreparedRails;
  }

  /** Resolved pair of source sides retained at transverse zero and one. */
  export type IPreparedRails = {
    /** Original field and map pair used when transverse coordinate is zero. */
    parent: IAutoMovieConstructionKnownPortSide;

    /** Original field and map pair used when transverse coordinate is one. */
    child: IAutoMovieConstructionKnownPortSide;
  };
}
