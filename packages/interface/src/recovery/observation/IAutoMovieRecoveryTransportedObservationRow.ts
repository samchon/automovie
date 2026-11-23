import type {
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryObservationTangents,
} from "../../index";

/** A closed observation row ordered in the retained incoming canonical phase. */
export interface IAutoMovieRecoveryTransportedObservationRow {
  /** Name retained from the current observation chart. */
  name: string;

  /** Fresh physical points in millimetres, without a repeated terminal point. */
  pointsMm: Readonly<AutoMovieVector3Tuple>[];

  /** Same-order persistent identities; a virtual seam has null identity. */
  anchorIds: (string | null)[];

  /** Zero-based indices of retained corner requests in this output row. */
  corners: number[];

  /**
   * Zero-based output sampling requests, including the canonical seam at index
   * zero.
   */
  schedule: number[];

  /** Same-order unit directions, preserving independent sides at corners. */
  tangents: IAutoMovieRecoveryObservationTangents[];

  /** Strictly increasing point phases from 0, followed by terminal 1. */
  phase: number[];
}
