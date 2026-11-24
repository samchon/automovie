import type { IAutoMovieViewAxis } from "../../../construction/IAutoMovieViewAxis";

/**
 * A prepared native F1 course and its forward arclength map.
 */
export namespace IAutoMovieHumanF1NativeCourse {
  /**
   * The native axis and its forward material-to-arclength conversion.
   */
  export interface IPrepared {
    /** World section planes read at the reference's material stations in mm. */
    axis: IAutoMovieViewAxis.IAxis;

    /** Placed course arclength in mm at a reference material station in mm. */
    physicalStation: (station: number) => number;
  }
}
