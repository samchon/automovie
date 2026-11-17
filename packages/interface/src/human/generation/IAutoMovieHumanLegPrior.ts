/**
 * Leg placement, section harmonics and tape ratios driven by public body measures.
 *
 * The interface package owns these declarations; AutoMovieHumanLegPrior in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Leg placement, section harmonics and tape ratios driven by public body measures. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only ICrotch, IRing, ICourse, IAnkle, ILateral, IPrior declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation ICrotch, IRing, ICourse, IAnkle, ILateral, IPrior separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanLegPrior exchanges the named ICrotch, IRing, ICourse, IAnkle, ILateral, IPrior contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanLegPrior {
  /** The crotch's height as a line in four public inputs.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The crotch's height as a line in four public inputs.
   * @evidence contracts/development/design.md#principled-representation `offset`: World millimetres. `height`: Millimetres per millimetre of stature. `inseam`: Millimetres per millimetre of inseam tape.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegPrior.ICrotch is the canonical exchange used by IAutoMovieHumanLegPrior.IPrior.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `offset`, `height`, `inseam`, `thigh`, `sex`; callers supply the complete record.
   */
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
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The crotch ring is tilted, so its horizontal projection is not a section: the last section of the law sits off that projection by a shared amount.
   * @evidence contracts/development/design.md#principled-representation `forward`: Section centre ahead of the ring's, in leg lengths. `lateral`: Section centre outside the ring's, in leg lengths.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegPrior.IRing is the canonical exchange used by IAutoMovieHumanLegPrior.IPrior.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `forward`, `lateral`; callers supply the complete record.
   */
  export interface IRing {
    /** Section centre ahead of the ring's, in leg lengths. */
    forward: number;

    /** Section centre outside the ring's, in leg lengths. */
    lateral: number;
  }

  /** Station of a tape measure and its ratio to the prior section's hull there.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Station of a tape measure and its ratio to the prior section's hull there.
   * @evidence contracts/development/design.md#principled-representation `station`: Leg fraction of the tape. `ratio`: Hull girth at the station per unit of the tape input.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegPrior.ICourse is the canonical exchange used by IAutoMovieHumanLegPrior.IPrior.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `station`, `ratio`; callers supply the complete record.
   */
  export interface ICourse {
    /** Leg fraction of the tape. */
    station: number;

    /** Hull girth at the station per unit of the tape input. */
    ratio: number;
  }

  /** The ankle centre ahead of the origin as a line, world millimetres.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The ankle centre ahead of the origin as a line, world millimetres.
   * @evidence contracts/development/design.md#principled-representation `offset`: Constant. `fat`: Per unit of the fat control. `muscularity`: Per unit of the muscularity control.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanBodyFrame.prior, AutoMovieHumanLegLaw.line.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `offset`, `fat`, `muscularity`; callers supply the complete record.
   */
  export interface IAnkle {
    /** Constant. */
    offset: number;

    /** Per unit of the fat control. */
    fat: number;

    /** Per unit of the muscularity control. */
    muscularity: number;
  }

  /** The axis's place off the midline per station: a constant and three inputs.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The axis's place off the midline per station: a constant and three inputs.
   * @evidence contracts/development/design.md#principled-representation `offset`: World millimetres. `leg`: Millimetres per millimetre of leg length. `hip`: Millimetres per millimetre of hip tape.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanLegPrior.ILateral is the canonical exchange used by IAutoMovieHumanLegPrior.IPrior.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `offset`, `leg`, `hip`, `sex`; callers supply the complete record.
   */
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

  /** The prior's channels.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The prior's channels.
   * @evidence contracts/development/design.md#principled-representation `crotch`: Height of the crotch. `ring`: The groin section against the crotch ring's projection. `ankle`: Forward place of the ankle centre.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanLegPrior.PRIOR, AutoMovieHumanLegLaw.prior.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `crotch`, `ring`, `ankle`, `stations`, `profile`, `forward`, `lateral`, `shape`, `calf`, `knee`, `thigh`; callers supply the complete record.
   */
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
     * Area-normalized radial shape of the left leg per station, as the
     * Fourier series `[a0, a1, b1, a2, b2, ...]` of the polar angle from
     * the front toward the outside.
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
