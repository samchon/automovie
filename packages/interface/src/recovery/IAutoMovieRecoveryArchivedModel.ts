import type { IAutoMovieFileReceipt } from "..";

/** Published lossless archive and verified original logical byte identity. */

export interface IAutoMovieRecoveryArchivedModel extends IAutoMovieFileReceipt {
  /** Lossless byte codec used for this archive. */
  codec: "gzip";

  /** Decoded byte population checked before retirement. */
  logicalBytes: number;

  /** SHA-256 checked over the decoded original publication. */
  logicalSha256: string;
}
