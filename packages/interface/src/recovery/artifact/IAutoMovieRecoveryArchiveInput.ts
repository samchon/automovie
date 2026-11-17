import type { IAutoMovieFileReceipt } from "../../index";

/**
 * Run-owned final model and exact bytes admitted for lossless archival.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Exclusive output directory owning the final model.
 * @evidence contracts/development/design.md#principled-representation Run-owned final model and exact bytes admitted for lossless archival.
 * @evidence contracts/development/design.md#minimal-and-owned-surface archiveAutoMovieRecoveryModel share IAutoMovieRecoveryArchiveInput's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export interface IAutoMovieRecoveryArchiveInput extends IAutoMovieFileReceipt {
  /** Exclusive output directory owning the final model. */
  output: string;
}
