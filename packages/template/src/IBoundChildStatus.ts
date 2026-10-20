/**
 * What the held child handle reports about the file it names.
 *
 * @evidence contracts/common.md#principled-implementation Ordinary-file and link-count facts accompany exact byte size and an opaque written-generation key observed through the child handle.
 * @evidence contracts/common.md#clear-and-simple-design The status keeps the facts required by write admission and resident verification without an unread separate file-identity field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The generation key includes actual identity and last-write state rather than a pathname-derived assumption.
 * @evidence contracts/common.md#meaningful-documentation Members explain link and regular-file qualification, byte units and opaque generation comparison.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The held child status schema declaration chooses no executable algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The held child status schema type coordinates no request or cached work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The held child status schema acquires no runtime handles, bytes or tasks.
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
