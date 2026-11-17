import type { IAutoMovieRecoveryModelCounts } from "../../index";

/**
 * Current append-only engine stream populations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Number of appended engine mesh chunks.
 * @evidence contracts/development/design.md#principled-representation Current append-only engine stream populations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieRecoveryMeshFrontier, IAutoMovieRecoveryMeshSpool share IAutoMovieRecoveryMeshCounts's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export interface IAutoMovieRecoveryMeshCounts extends IAutoMovieRecoveryModelCounts {
  /** Number of appended engine mesh chunks. */
  chunks: number;
}
