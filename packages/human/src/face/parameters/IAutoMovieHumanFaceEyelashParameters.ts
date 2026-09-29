/**
 * One eye's upper and lower eyelash populations as observed at their lids.
 * A study of 50 healthy Japanese adults measured the longest shaft and the
 * shaft count in the central 2 mm of the right upper and lower lids, and classified straight
 * versus curly form
 * (https://oatext.com/A-study-of-normal-eyelashes-in-Japanese-individuals.php).
 * The same landmark definition can be applied on the left, without treating
 * this right-only sample as a left-side norm. Its lateral-photograph angle is
 * relative to image vertical, so it is not a
 * portable 3D anatomical root angle and is absent here. This cohort supplies
 * no universal cutoff. The shaft count is biological, not renderer cards;
 * neither a lash root list nor a trajectory is authored here.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceEyelashParameters {
  /** Upper lid population. */
  upper?: IAutoMovieHumanFaceEyelashParameters.Margin;
  /** Lower lid population. */
  lower?: IAutoMovieHumanFaceEyelashParameters.Margin;
}

export namespace IAutoMovieHumanFaceEyelashParameters {
  /**
   * A lid margin's population-level dimensions.
   * @author Samchon
   */
  export interface Margin {
    /** Longest visible shaft from the central 2 mm of lid edge, in mm. */
    longestCentralLengthMm?: number;
    /** Number of shafts rooted in that central 2 mm. */
    centralTwoMmShaftCount?: number;
    /** Observed shaft form, separate from any generated card curve. */
    form?: "straight" | "curly";
  }
}
