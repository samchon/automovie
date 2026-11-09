/**
 * The part's own phase as a join curve's parameter: the curve's point at a phase is where that phase line of the part crosses the host.
 *
 * @evidence contracts/development/design.md#principled-representation The fourth equation is `phi - t = 0`, so the curve is a graph over the part's phase and the part is only shortened along its station lines.
 * @evidence contracts/development/design.md#minimal-and-owned-surface A record with only its discriminator; the part's phase needs no data.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A phase line that meets the host twice or never is a singular or lost trace, reported; the angle or arc parameter is the author's choice for such a part.
 * @evidence contracts/development/common.md#meaningful-documentation States the parameter's equation, the part rail it implies and when it fails.
 */
export interface IAutoMovieConstructionPhaseParameter {
  /** Discriminator. */
  type: "phase";
}
