import type { AutoMovieAuthoredDocumentLayer } from "@automovie/evidence";


/**
 * The entire read capability available to the provider, already bound to one root.
 *
 * @evidence contracts/common.md#principled-implementation A root-bound read/list capability supplies current bounded bytes and canonical authored identities.
 * @evidence contracts/common.md#clear-and-simple-design The provider receives only the operations it requires, with no physical root replacement or write method.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reader capability cannot compile or author production content.
 * @evidence contracts/common.md#meaningful-documentation Members document current byte reads, canonical enumeration and absent-layer behavior.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration chooses no runtime algorithm; its producer owns traversal and parsing costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares a representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased read/list capability opens no path; createAutoMovieReferenceReader returns a closure with pinned root observations, and its actual read implementation owns descriptor acquisition and release per request.
 *
 * @author Samchon
 */
export interface IAutoMovieReferenceReader {

  /** Read one canonical authored file's current bounded bytes without mutating the production.
   *
   * @evidence contracts/common.md#principled-implementation An already bound reader returns current bounded bytes for one canonical authored Markdown identity.
   * @evidence contracts/common.md#clear-and-simple-design Provider dispatch receives only byte access rather than an arbitrary filesystem root.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The capability cannot write or compile source and must not return an invented success for an unsafe identity.
   * @evidence contracts/common.md#meaningful-documentation The member states current byte reads and production nonmutation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no runtime algorithm; the supplied concrete operation owns traversal and I/O costs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This capability declaration coordinates no cache; the owning operation decides when effects and observations may be reused.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returned bytes transfer to the request owner; createAutoMovieReferenceReader awaits finally-block close attempts for every opened descriptor. A rejected close propagates as IO_ERROR and does not certify physical release.
   */
  read(file: string): Promise<Uint8Array>;

  /** Enumerate canonical authored Markdown identities; a missing layer yields an empty list.
   *
   * @evidence contracts/common.md#principled-implementation A bound reader enumerates canonical Markdown identities in one shared authored layer, with an absent layer represented by an empty array.
   * @evidence contracts/common.md#clear-and-simple-design Layer inventory is separate from source-body reading and provider page parsing.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The layer does not admit contract/accounts populations or fabricate a title from a filename.
   * @evidence contracts/common.md#meaningful-documentation The member states canonical enumeration and missing-layer meaning.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no runtime algorithm; the supplied concrete operation owns traversal and I/O costs.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work This capability declaration coordinates no cache; the owning operation decides when effects and observations may be reused.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The request owns the returned path array; the concrete reader retains only pinned root facts across operations.
   */
  list(layer: AutoMovieAuthoredDocumentLayer): Promise<readonly string[]>;
}
