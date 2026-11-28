/**
 * Height field over a station and phase window of a base loft. The cubic
 * control net gives a displacement in millimetres along the authored world
 * direction. Keep the three outer rows and columns at zero so height and its
 * first two partials vanish at the window edge. Changing the net changes
 * height; changing the window changes its support.
 */
export interface IAutoMovieLoftRelief {
  /** Relief identifier used by diagnostics and part references. */
  name: string;

  /** Increasing physical station window on the base loft, in millimetres. */
  stations: IAutoMovieLoftRelief.IRange;

  /**
   * Phase window in radians. The evaluator wraps the endpoint difference to one
   * turn; a whole-turn difference or equal endpoints selects a full turn.
   */
  phases: IAutoMovieLoftRelief.IRange;

  /**
   * Unit world displacement direction. With turn present, this direction
   * applies at the middle of the window.
   */
  axis: [number, number, number];

  /**
   * Optional unit world direction perpendicular to axis. At phase t the
   * displacement direction is cos(t − c) × axis + sin(t − c) × turn, where c is
   * the middle phase of the window. Omit it for a fixed axis.
   */
  turn?: [number, number, number];

  /**
   * Number of station controls in the net. Use at least seven rows to leave
   * interior controls after the three zero rows at each end.
   */
  rows: number;

  /**
   * Number of phase controls in each row. Use at least seven columns to leave
   * interior controls after the three zero columns at each end.
   */
  columns: number;

  /**
   * Control heights in millimetres, stored in rows from the lowest station with
   * phase varying within each row. Supply rows × columns values with the three
   * outer rows and columns zero.
   */
  heights: number[];

  /**
   * Optional station shift in millimetres on the same net and zero border as
   * heights. The reader evaluates height at s + D(s, t) for interpolated shift
   * D. Omit the field to read height at the base station s.
   */
  shift?: number[];
}

export namespace IAutoMovieLoftRelief {
  /**
   * Endpoints of an authored relief window. The stations field interprets them
   * in millimetres and phases in radians with wrapped width.
   */
  export interface IRange {
    /** Window start in the owning field's units. */
    readonly start: number;
    /**
     * Window end in the owning field's units. Phase windows apply their
     * wrapped-width convention to this endpoint.
     */
    readonly end: number;
  }
}
