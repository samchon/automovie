/**
 * The shape-dependent joint points of a face basis: their ids, rest positions
 * and sparse endpoint rows (`IAutoMovieHumanFaceBasis.landmarks`).
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceBasisLandmarks {
  /** Landmark names, in row order. */
  ids: string[];

  /** Flat XYZ per landmark, in the basis frame. */
  positions: number[];

  /** Sparse rows per endpoint name, strictly increasing by landmark. */
  targets: Record<string, number[]>;
}
