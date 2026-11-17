import type { IAutoMovieHumanLegProfile } from "./IAutoMovieHumanLegProfile";
import type { IAutoMovieHumanLegStations } from "./IAutoMovieHumanLegStations";

/**
 * Leg tapes, endpoint conditions, ordered normalized rows and millimetre-station girth readers. Runtime construction and admission remain with AutoMovieHumanLegGirth in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes leg tapes, endpoint conditions, ordered normalized rows and millimetre-station girth readers; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Leg tapes, endpoint conditions, ordered normalized rows and millimetre-station girth readers. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanLegGirth; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing LegGirth contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
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

  /**
   * Readonly [station share, ratio] rows in increasing share order; both components are dimensionless. The reader interpolates linearly between rows and holds the endpoint ratios outside them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Readonly [station share, ratio] rows in increasing share order; both components are dimensionless. The reader interpolates linearly between rows and holds the endpoint ratios outside them.
   * @evidence contracts/development/design.md#principled-representation Readonly [station share, ratio] rows in increasing share order; both components are dimensionless. The reader interpolates linearly between rows and holds the endpoint ratios outside them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegGirth.RatioAtTable is the canonical exchange used by AutoMovieHumanLegGirth.ratioAt.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias retains the existing AutoMovieHumanLegGirth input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
   */
  export type RatioAtTable = readonly (readonly [number, number])[];

  /**
   * Requested section girth in millimetres at physical station s in millimetres. The produced law holds its endpoint values beyond the first and last knots.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Requested section girth in millimetres at physical station s in millimetres. The produced law holds its endpoint values beyond the first and last knots.
   * @evidence contracts/development/design.md#principled-representation Requested section girth in millimetres at physical station s in millimetres. The produced law holds its endpoint values beyond the first and last knots.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegGirth.OfResult is the canonical exchange used by AutoMovieHumanLegGirth.of.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias retains the existing AutoMovieHumanLegGirth input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
   */
  export type OfResult = (s: number) => number;
}
