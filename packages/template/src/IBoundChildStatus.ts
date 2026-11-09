/**
 * What the held child handle reports about the file it names.
 *
 * @evidence contracts/development/design.md#principled-representation Ordinary-file and link-count facts accompany exact byte size and an opaque written-generation key observed through the child handle.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The status keeps the facts required by write admission and resident verification without an unread separate file-identity field.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The generation key includes actual identity and last-write state rather than a pathname-derived assumption.
 * @evidence contracts/development/common.md#meaningful-documentation Members explain link and regular-file qualification, byte units and opaque generation comparison.
 */
export interface IBoundChildStatus {
  /** Whether the held child is a symbolic link or Windows reparse point. */
  link: boolean;

  /** Native hard-link population; exactly one is required before and after writing. */
  links: bigint;

  /** Whether the held child is an ordinary file, excluding links and directories. */
  regular: boolean;

  /** Exact current file size in bytes, compared with the requested content length. */
  size: bigint;

  /** Opaque physical-identity, size and last-write generation key for before-and-after resident verification. */
  version: string;
}
