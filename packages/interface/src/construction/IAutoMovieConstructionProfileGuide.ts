/**
 * Named guide at an original clock value on one retained piece. Use the source
 * curve's clock units and keep the value inside that piece's declared
 * interval.
 */
export interface IAutoMovieConstructionProfileGuide {
  /** Stable guide identity unique within the profile family. */
  id: string;

  /** ID of the retained source piece carrying this guide. */
  piece: string;

  /** Original curve parameter in the piece interval, in that curve's units. */
  clock: number;
}
