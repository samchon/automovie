import type { IAutoMovieConstructionKnownPort } from "./IAutoMovieConstructionKnownPort";
import type { IAutoMovieConstructionKnownPortSide } from "./IAutoMovieConstructionKnownPortSide";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** Prepared original-field port surface and the neighboring owners it retains. */
export namespace IAutoMoviePreparedConstructionKnownPort {
  /**
   * Surface with u in [0,1] from parent to child and v in the original clock
   * interval. Its orientation is the negative of definition.orientation because
   * the chart axes are transposed; an authored period is retained on v. Points
   * are world millimetres and all jet orders use these transposed variables.
   *
   * The descriptor is detached, but field/map owners remain borrowed and must
   * stay immutable. Point queries work independently of map total2. Jet queries
   * reject null/nonfinite map derivatives and degenerate tangent planes;
   * callback exceptions propagate. Returned vectors are freshly computed.
   */
  export interface IPrepared extends IAutoMovieSolidSurface {
    /**
     * Detached descriptor retains original clock bounds and authored outward
     * convention.
     */
    definition: IAutoMovieConstructionKnownPort;

    /**
     * Actual immutable field/map owners of both rails; labels alone certify no
     * weights.
     */
    rails: {
      /** Original field and map that own the transverse-zero boundary. */
      parent: IAutoMovieConstructionKnownPortSide;

      /** Original field and map that own the transverse-one boundary. */
      child: IAutoMovieConstructionKnownPortSide;
    };
  }
}
