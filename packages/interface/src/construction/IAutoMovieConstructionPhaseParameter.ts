/**
 * The part's own phase as a join curve's parameter: the curve's point at a phase is where that phase line of the part crosses the host.
 *
 * @evidence contracts/common.md#principled-implementation The fourth equation is `phi - t = 0`, so the curve is a graph over the part's phase and the part is only shortened along its station lines.
 * @evidence contracts/common.md#clear-and-simple-design A record with only its discriminator; the part's phase needs no data.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A phase line that meets the host twice or never is a singular or lost trace, reported; the angle or arc parameter is the author's choice for such a part.
 * @evidence contracts/common.md#meaningful-documentation States the parameter's equation, the part rail it implies and when it fails.
 */
export interface IAutoMovieConstructionPhaseParameter {
  /** Discriminator. */
  type: "phase";
}
