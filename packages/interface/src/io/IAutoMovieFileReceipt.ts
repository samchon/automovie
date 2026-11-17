import type { IAutoMovieByteDigest } from "../index";

/**
 * Location and exact-byte identity of one completed file publication.
 * Paths retain the publishing host's spelling and resolution base; this contract
 * neither resolves them nor promises they are absolute. The publisher owns atomic
 * creation and handle closure. A reader verifies bytes before accepting a later
 * acquisition; a receipt alone cannot prevent replacement at the same path.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States path resolution ownership, publication completion and revalidation on acquisition.
 * @evidence contracts/development/design.md#principled-representation Extending the common byte digest keeps path identity distinct from content identity without changing encoding semantics.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Ordinary artifact publication and checkpoint/frontier receipts use this same path-plus-digest identity.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The receipt carries neither an open file handle nor geometry/completion claims beyond the stored publication.
 */

export interface IAutoMovieFileReceipt extends IAutoMovieByteDigest {
 
 /** Published path in the caller's host namespace; readers use that host's resolution base. */
  path: string;
}
