import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/** The deterministic renderer lane of one delivered occurrence. */
export interface IAutoMovieProductionRenditionDeliveryDeterministicLane {
  /** Deterministic renderer source, unaffected by resident repaint data. */
  lane: "deterministic";

  /** Current deterministic feature source digest. */
  sourceDigest: AutoMovieContentDigest;

  /** No repaint lineage belongs to this lane. */
  receiptDigest: null;

  /** No active selection belongs to this lane. */
  selectionDigest: null;
}
