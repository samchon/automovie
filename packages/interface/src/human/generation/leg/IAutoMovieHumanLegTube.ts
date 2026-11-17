import type { IAutoMovieLoftRelief } from "../../../construction/IAutoMovieLoftRelief";
import type { IAutoMovieHumanLegGuides } from "./IAutoMovieHumanLegGuides";
import type { IAutoMovieHumanLegStations } from "./IAutoMovieHumanLegStations";

/** Type contracts exchanged by AutoMovieHumanLegTube; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanLegTube {
  /** One station's section.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One station's section.
   * @evidence contracts/development/design.md#principled-representation `scale`: The scale from the unit shape to millimetres. `girth`: The taut girth of the section, mm. `points`: The 264 knot points `[x, z]`, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanLegTube.of. Read by AutoMovieHumanLegSectionLaw.radii. Also types AutoMovieHumanLegSectionLaw.tube.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `scale`, `girth`, `points`, `controls`; callers supply the complete record.
   */
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

  /** What the tube is placed from.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the tube is placed from.
   * @evidence contracts/development/design.md#principled-representation `bones`: The joints' heights, which place the landmark rows. `girth`: The girth the section asks for at a station, mm. `reliefs`: The reliefs, their windows on the chart (station in mm, phase in radians) and their axes in the section frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanLegTube.of.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `ends`: The neighbours' rings as the shape's first and last rows.
   */
  export interface IInput {
    /** The joints' heights, which place the landmark rows. */
    bones: IAutoMovieHumanLegStations.IBones;

    /** The girth the section asks for at a station, mm. */
    girth: (s: number) => number;

    /** The reliefs, their windows on the chart (station in mm, phase in radians) and their axes in the section frame. */
    reliefs: readonly IAutoMovieLoftRelief[];

    /** The neighbours' rings as the shape's first and last rows. */
    ends?: IAutoMovieHumanLegGuides.IEnds;
  }

  /** Result of AutoMovieHumanLegTube.of. The tube.
  @param input The joints, the girth law and the reliefs.
  @returns The section at a station.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The tube.
 * @evidence contracts/development/design.md#principled-representation The tube. The callable takes s and returns ISection.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegTube.OfResult is the canonical exchange used by AutoMovieHumanLegTube.of.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegTube.of for the tube.
 */
  export type OfResult = (s: number) => ISection;
}
