import type { IAutoMovieFileReceipt } from "..";

/** Run-owned final model and exact bytes admitted for lossless archival. */

export interface IAutoMovieRecoveryArchiveInput extends IAutoMovieFileReceipt {
  /** Exclusive output directory owning the final model. */
  output: string;
}
