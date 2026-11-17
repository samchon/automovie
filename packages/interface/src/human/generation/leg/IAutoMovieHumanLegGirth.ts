import type { IAutoMovieHumanLegProfile } from "./IAutoMovieHumanLegProfile";
import type { IAutoMovieHumanLegStations } from "./IAutoMovieHumanLegStations";

/** Type contracts exchanged by AutoMovieHumanLegGirth; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanLegGirth {
  /** The tapes the law reads, mm.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The tapes the law reads, mm.
   * @evidence contracts/development/design.md#principled-representation `thigh`: Thigh girth. `knee`: Knee girth at mid-patella. `calf`: Calf girth at its maximum.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanLegGirth.tapes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `thigh`, `knee`, `calf`; callers supply the complete record.
   */
  export interface ITapes {
    /** Thigh girth. */
    thigh: number;

    /** Knee girth at mid-patella. */
    knee: number;

    /** Calf girth at its maximum. */
    calf: number;
  }

  /** What the law is placed from.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the law is placed from.
   * @evidence contracts/development/design.md#principled-representation `tapes`: The tapes. `bones`: The joints' heights, mm. `scale`: Calibration millimetres per world millimetre.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanLegGirth.tapeStation, AutoMovieHumanLegGirth.of.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `ends`: The neighbours' rings, each a knot at its own station with its taut girth, `[girth]`. `site`: The thigh tape's station, mm: the person's gluteal furrow height, since ISO 8559-1 5.3.20 takes the thigh girth just below the gluteal fold.
   */
  export interface IInput {
    /** The tapes. */
    tapes: ITapes;

    /** The joints' heights, mm. */
    bones: IAutoMovieHumanLegStations.IBones;

    /** Calibration millimetres per world millimetre. */
    scale: number;

    /** The neighbours' rings, each a knot at its own station with its taut girth, `[girth]`. */
    ends?: IAutoMovieHumanLegProfile.IEnds;

    /**
     * The thigh tape's station, mm: the person's gluteal furrow height, since
     * ISO 8559-1 5.3.20 takes the thigh girth just below the gluteal fold.
     * Absent, or not above the next thigh row, the tape stands at
     * {@link THIGH_SITE} of the thigh.
     */
    site?: number;
  }

  /** The table argument of AutoMovieHumanLegGirth.ratioAt. A table's ratio at a share: linear between its two rows either side, held
  at the end rows past them.
  @param table Rows `[share, ratio]` by increasing share.
  @param share The share read.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A table's ratio at a share: linear between its two rows either side, held at the end rows past them.
 * @evidence contracts/development/design.md#principled-representation A table's ratio at a share: linear between its two rows either side, held at the end rows past them. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegGirth.RatioAtTable is the canonical exchange used by AutoMovieHumanLegGirth.ratioAt.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegGirth.ratioAt for a table's ratio at a share: linear between its two rows either side, held at the end rows past them.
 */
  export type RatioAtTable = readonly (readonly [number, number])[];

  /** Result of AutoMovieHumanLegGirth.of. The girth law.
  @param input The tapes, the joints and the scale.
  @returns The girth the section asks for at a station, mm, held at the end knots past them.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The girth law.
 * @evidence contracts/development/design.md#principled-representation The girth law. The callable takes s and returns number.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegGirth.OfResult is the canonical exchange used by AutoMovieHumanLegGirth.of.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanLegGirth.of for the girth law.
 */
  export type OfResult = (s: number) => number;
}
