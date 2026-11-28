import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** Collapsed profile ends retained between face publication and skin closure. */
export namespace IAutoMovieConstructionProfileBody {
  /**
   * Collapsed source end and its neighboring regular ring in the realized body.
   * Stations use kernel millimetres. The retained surface and face checks let
   * skin closure query the original tip and verify which ring arcs survived.
   */
  export interface IEnd {
    /** Original retained surface used for a point read at the collapsed tip. */
    surface: IAutoMovieSolidSurface;

    /** Physical station of the collapsed tip in kernel millimetres. */
    station: number;

    /**
     * Physical station in kernel millimetres of the nearest emitted regular
     * ring.
     */
    regular: number;

    /**
     * Shared mesh vertex IDs of the ring in positive boundary traversal. The
     * bottom reverses the loop clock.
     */
    vertices: number[];

    /**
     * One arc record per retained piece segment. The face index locates the
     * actual body face, phase is the arc midpoint in normalized [0, 1], and
     * from and to are the shared vertex IDs at its ends.
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
