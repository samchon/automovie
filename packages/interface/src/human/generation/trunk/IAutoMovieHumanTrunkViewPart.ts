/**
 * The upper head-axis support datum retained outside the trunk's regular
 * connection domain.
 *
 * The interface package owns these declarations; AutoMovieHumanTrunkViewPart in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanTrunkViewPart {
  /**
   * The trunk's retained upper scalar-support datum, on the head axis above the
   * regular connection, in calibration millimetres. A shared connection
   * excludes it from the actual part domain without changing the source clock.
   */
  export interface ITop {
    /** Forward place of the head mass's axis, mm. */
    x: number;

    /** Height inside the head mass's neck domain, mm. */
    y: number;
  }
}
