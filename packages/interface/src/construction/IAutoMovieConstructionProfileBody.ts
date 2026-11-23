import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** Collapsed profile ends retained between face publication and skin closure. */
export namespace IAutoMovieConstructionProfileBody {
  /** An actual collapsed endpoint and its existing neighboring regular ring. */
  export interface IEnd {
    /** Original collapsed point belongs to this actual retained surface. */
    surface: IAutoMovieSolidSurface;

    /** Actual physical station mm, not the first regular tessellation row. */
    station: number;

    /**
     * Actual neighboring regular ring station mm; its original cap strip is not
     * a trimmed patch.
     */
    regular: number;

    /** Positive native boundary traversal: bottom reverses the loop clock. */
    vertices: number[];

    /**
     * One check per arc in piece traversal order, independent of the bottom
     * end's reversed vertex traversal.
     */
    checks: {
      /** Index of the retained face in the same body's faces array. */
      face: number;

      /**
       * Arc midpoint in that piece's normalized [0,1] coordinate, used at the
       * actual tip station.
       */
      phase: number;

      /** Shared mesh vertex ID at the arc's first endpoint. */
      from: number;

      /**
       * Shared mesh vertex ID at the arc's next endpoint, possibly in the next
       * piece.
       */
      to: number;
    }[];
  }
}
