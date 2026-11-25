/**
 * The part's own phase as a join curve's parameter: the curve's point at a
 * phase is where that phase line of the part crosses the host.
 */
export interface IAutoMovieConstructionPhaseParameter {
  /** Discriminator. */
  type: "phase";
}
