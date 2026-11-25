/**
 * A fixed upper/lower limb configuration in clinical degrees, with its optional
 * fit weight. Laws retain a named plan instant's configuration rather than a
 * previous evaluated frame.
 */
export interface IAutoMovieHumanLimbReference {
  /** The upper bone's `[flexion, abduction, twist]`, degrees. */
  upper: readonly [number, number, number];

  /** The lower bone's `[flexion, abduction, twist]`, degrees. */
  lower: readonly [number, number, number];

  /**
   * How much a degree of joint turn from the reference counts, in degrees of
   * hand or foot rotation error (the engine's `referenceWeight`); 1 when
   * omitted. A reach toward the reference's instant raises it from 0 to 1.
   */
  weight?: number;
}
