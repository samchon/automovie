/**
 * Type contracts exchanged by AutoMovieHumanArmInterim; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanArmInterim exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups ISitesPlacement. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanArmInterim; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the ISitesPlacement contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanArmInterim {
  /** The placement argument of AutoMovieHumanArmInterim.sites. The arm's site laws.
  @param side The arm.
  @param inputs The arm's tapes and the hands' dimensions, calibration mm.
  @param elbow The elbow centre.
  @param wrist The wrist centre.
  @param placement Actual GH projection and rigid humerus from the same production skeleton, calibration mm.
  @param crease Include the independent public palm-crease course.
  @param radialCenter The palm breadth-centre offset from MCP3 along radial u, mm; zero for a caller without the source hand record.
  @returns The site laws.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The arm's site laws.
 * @evidence contracts/development/design.md#principled-representation `projection`: Glenohumeral centre's lateral projection from the body's median plane, calibration millimetres. `humerus`: Rigid shoulder-to-elbow centre distance, calibration millimetres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanArmInterim.ISitesPlacement is the canonical exchange used by AutoMovieHumanArmInterim.sites.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `projection`, `humerus`; callers supply the complete record.
 */
  export type ISitesPlacement = {
    /** Glenohumeral centre's lateral projection from the body's median plane, calibration millimetres. */
    projection: number;
    /** Rigid shoulder-to-elbow centre distance, calibration millimetres. */
    humerus: number;
  };
}
