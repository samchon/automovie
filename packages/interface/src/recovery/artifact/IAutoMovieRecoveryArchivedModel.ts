import type { IAutoMovieFileReceipt } from "../../index";

/**
 * Published lossless archive and verified original logical byte identity.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lossless byte codec used for this archive. Decoded byte population checked before retirement.
 * @evidence contracts/development/design.md#principled-representation Lossless byte codec used for this archive.
 * @evidence contracts/development/design.md#minimal-and-owned-surface archiveAutoMovieRecoveryModel share IAutoMovieRecoveryArchivedModel's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export interface IAutoMovieRecoveryArchivedModel extends IAutoMovieFileReceipt {
  /** Lossless byte codec used for this archive. */
  codec: "gzip";

  /** Decoded byte population checked before retirement. */
  logicalBytes: number;

  /** SHA-256 checked over the decoded original publication. */
  logicalSha256: string;
}
