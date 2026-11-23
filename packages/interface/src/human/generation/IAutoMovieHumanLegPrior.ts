/**
 * Leg placement, section harmonics and tape ratios driven by public body
 * measures.
 *
 * The interface package owns these declarations; AutoMovieHumanLegPrior in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanLegPrior {
  /** The crotch's height as a line in four public inputs. */
  export interface ICrotch {
    /** World millimetres. */
    offset: number;

    /** Millimetres per millimetre of stature. */
    height: number;

    /** Millimetres per millimetre of inseam tape. */
    inseam: number;

    /** Millimetres per millimetre of thigh tape. */
    thigh: number;

    /** World millimetres per unit of the masculine-feminine control. */
    sex: number;
  }

  /**
   * The crotch ring is tilted, so its horizontal projection is not a section:
   * the last section of the law sits off that projection by a shared amount.
   */
  export interface IRing {
    /** Section centre ahead of the ring's, in leg lengths. */
    forward: number;

    /** Section centre outside the ring's, in leg lengths. */
    lateral: number;
  }

  /** Station of a tape measure and its ratio to the prior section's hull there. */
  export interface ICourse {
    /** Leg fraction of the tape. */
    station: number;

    /** Hull girth at the station per unit of the tape input. */
    ratio: number;
  }

  /** The ankle centre ahead of the origin as a line, world millimetres. */
  export interface IAnkle {
    /** Constant. */
    offset: number;

    /** Per unit of the fat control. */
    fat: number;

    /** Per unit of the muscularity control. */
    muscularity: number;
  }

  /** The axis's place off the midline per station: a constant and three inputs. */
  export interface ILateral {
    /** World millimetres. */
    offset: readonly number[];

    /** Millimetres per millimetre of leg length. */
    leg: readonly number[];

    /** Millimetres per millimetre of hip tape. */
    hip: readonly number[];

    /** World millimetres per unit of the masculine-feminine control. */
    sex: readonly number[];
  }

  /** The prior's channels. */
  export interface IPrior {
    /** Height of the crotch. */
    crotch: ICrotch;

    /** The groin section against the crotch ring's projection. */
    ring: IRing;

    /** Forward place of the ankle centre. */
    ankle: IAnkle;

    /** Leg fractions of the channels, ankle first. */
    stations: readonly number[];

    /** Log of the equivalent radius in leg lengths. */
    profile: readonly number[];

    /** Section centre ahead of the ankle centre, in leg lengths. */
    forward: readonly number[];

    /** Section centre off the midline, as a line. */
    lateral: ILateral;

    /**
     * Area-normalized radial shape of the left leg per station, as the Fourier
     * series `[a0, a1, b1, a2, b2, ...]` of the polar angle from the front
     * toward the outside.
     */
    shape: readonly (readonly number[])[];

    /** Calf tape. */
    calf: ICourse;

    /** Knee tape. */
    knee: ICourse;

    /** Thigh tape. */
    thigh: ICourse;
  }
}
