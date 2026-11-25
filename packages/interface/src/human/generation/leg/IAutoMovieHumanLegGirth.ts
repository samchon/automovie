import type { IAutoMovieHumanLegProfile } from "./IAutoMovieHumanLegProfile";
import type { IAutoMovieHumanLegStations } from "./IAutoMovieHumanLegStations";

/**
 * Leg tapes, endpoint conditions, ordered normalized rows and
 * millimetre-station girth readers. Runtime construction and admission remain
 * with AutoMovieHumanLegGirth in Human.
 */
export namespace IAutoMovieHumanLegGirth {
  /** The tapes the law reads, mm. */
  export interface ITapes {
    /** Thigh girth. */
    thigh: number;

    /** Knee girth at mid-patella. */
    knee: number;

    /** Calf girth at its maximum. */
    calf: number;
  }

  /** What the law is placed from. */
  export interface IInput {
    /** The tapes. */
    tapes: ITapes;

    /** The joints' heights, mm. */
    bones: IAutoMovieHumanLegStations.IBones;

    /** Calibration millimetres per world millimetre. */
    scale: number;

    /**
     * The neighbours' rings, each a knot at its own station with its taut
     * girth, `[girth]`.
     */
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
   * Readonly [station share, ratio] rows in increasing share order; both
   * components are dimensionless. The reader interpolates linearly between rows
   * and holds the endpoint ratios outside them.
   */
  export type RatioAtTable = readonly (readonly [number, number])[];

  /**
   * Requested section girth in millimetres at physical station s in
   * millimetres. The produced law holds its endpoint values beyond the first
   * and last knots.
   */
  export type OfResult = (s: number) => number;
}
