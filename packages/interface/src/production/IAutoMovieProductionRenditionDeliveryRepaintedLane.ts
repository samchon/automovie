import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/** The selected-repaint lane of one delivered occurrence. */
export interface IAutoMovieProductionRenditionDeliveryRepaintedLane {
  /** Explicit selected repaint source. */
  lane: "repainted";

  /** Candidate output digest, repeated as the exact source identity. */
  sourceDigest: AutoMovieContentDigest;

  /** Digest of the canonical immutable candidate receipt. */
  receiptDigest: AutoMovieContentDigest;

  /** Digest of the active immutable selection record. */
  selectionDigest: AutoMovieContentDigest;

  /** Stable active selection identity. */
  selectionId: string;

  /** Immutable request identity. */
  requestId: string;

  /** Immutable successful attempt identity. */
  attemptId: string;
}
