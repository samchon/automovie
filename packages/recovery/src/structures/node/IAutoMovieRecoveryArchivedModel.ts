import type { IAutoMovieRecoveryFileReceipt } from "./IAutoMovieRecoveryFileReceipt";

/**
 * Published lossless archive and verified original logical byte identity.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields preserve the existing publication, ownership and qualification quantities without changing runtime values.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One independently named record is shared by its producer and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration infers no observations, supplies no geometry and changes no admission policy.
 * @evidence contracts/development/common.md#meaningful-documentation Members state byte, population, ownership, presence and qualification meanings.
 */
export interface IAutoMovieRecoveryArchivedModel extends IAutoMovieRecoveryFileReceipt {
  /** Lossless byte codec used for this archive. */
  codec: "gzip";

  /** Decoded byte population checked before retirement. */
  logicalBytes: number;

  /** SHA-256 checked over the decoded original publication. */
  logicalSha256: string;
}
