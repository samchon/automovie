/**
 * Public contracts for the inner curve of a course turn.
 */
export namespace IAutoMovieHumanF1CourseLaw {
  /**
   * One turn read against the turn rule.
   */
  export interface IFold {
    /** The interior centre's name. */
    centre: string;
    /** The station of the turn's middle, mm. */
    station: number;
    /** The stored half arclength, mm. */
    half: number;
    /** The turn's angle, radians. */
    angle: number;
    /** The section's reach toward the turn's centre of curvature at the turn's middle, mm. */
    concave: number;
    /** The least half length the rule allows, mm: `(15 / 16) angle concave`. */
    least: number;
    /** `half / least`: under 1 the sections cross on the concave side. */
    margin: number;
  }
}
