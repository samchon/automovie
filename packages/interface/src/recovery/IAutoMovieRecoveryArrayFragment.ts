import type { IAutoMovieFileReceipt } from "..";

/** Persisted generating array fragment with exact byte and item populations. */

export interface IAutoMovieRecoveryArrayFragment extends IAutoMovieFileReceipt {
  /** Number of values in the persisted array fragment. */
  items: number;
}
