import type { IAutoMovieLoftRelief } from "../../../construction/IAutoMovieLoftRelief";
import type { IAutoMovieHumanLegGuides } from "./IAutoMovieHumanLegGuides";
import type { IAutoMovieHumanLegStations } from "./IAutoMovieHumanLegStations";

/**
 * Type contracts exchanged by AutoMovieHumanLegTube; runtime evaluation remains
 * in Human.
 */
export namespace IAutoMovieHumanLegTube {
  /** One station's section. */
  export interface ISection {
    /** The scale from the unit shape to millimetres. */
    scale: number;

    /** The taut girth of the section, mm. */
    girth: number;

    /** The 264 knot points `[x, z]`, mm. */
    points: [number, number][];

    /** The spline section's coefficients `[x_0 .. x_263, z_0 .. z_263]`, mm. */
    controls: number[];
  }

  /** What the tube is placed from. */
  export interface IInput {
    /** The joints' heights, which place the landmark rows. */
    bones: IAutoMovieHumanLegStations.IBones;

    /** The girth the section asks for at a station, mm. */
    girth: (s: number) => number;

    /**
     * The reliefs, their windows on the chart (station in mm, phase in radians)
     * and their axes in the section frame.
     */
    reliefs: readonly IAutoMovieLoftRelief[];

    /** The neighbours' rings as the shape's first and last rows. */
    ends?: IAutoMovieHumanLegGuides.IEnds;
  }

  /**
   * Result of AutoMovieHumanLegTube.of. The tube.
   *
   * @param input The joints, the girth law and the reliefs.
   * @returns The section at a station.
   */
  export type OfResult = (s: number) => ISection;
}
