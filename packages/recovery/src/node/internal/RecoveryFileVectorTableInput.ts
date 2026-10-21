/**
 * Declare borrowed positional I/O for one exclusive binary64 vector table.
 * The caller owns the descriptor and closes it after finish or failure. Callback
 * buffers are borrowed only during a call; byte counts report actual progress.
 *
 * @evidence contracts/common.md#principled-implementation Safe logical row ceilings and actual positional byte transfers preserve complete binary64 rows, partial I/O and EOF semantics.
 * @evidence contracts/common.md#clear-and-simple-design This erased input separates caller descriptor ownership from the table's private pages and logical state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Callbacks cannot retain borrowed pages, fabricate unread bytes or substitute another table; no geometry or arithmetic policy is added.
 * @evidence contracts/common.md#meaningful-documentation States row-count admission, absolute byte addressing, progress and borrowed-buffer/descriptor lifetimes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The erased input performs no operation; the numerical owner admits and consumes it.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The table owner supplies page reuse; this input carries no retained cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns its exclusive descriptor and callbacks; this erased declaration acquires no resource.
 */
export interface RecoveryFileVectorTableInput {
  /** Positive logical row ceiling, safely representable as rowCount times 24 bytes. */
  maxRows: number;

  /**
   * Read existing exclusive backing bytes into a borrowed page; return progress.
   *
   * @evidence contracts/common.md#principled-implementation Explicit absolute byte addresses and actual byte counts preserve partial-read and EOF semantics.
   * @evidence contracts/common.md#clear-and-simple-design The caller owns the descriptor; the table owns progress and row validity.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The callback cannot retain or replace the borrowed page or fabricate unread bytes.
   * @evidence contracts/common.md#meaningful-documentation States borrowed buffer ownership, existing-byte reads and returned progress.
   * @evidence contracts/performance.md#efficient-algorithms Each callback reads at most the remainder of one valid page prefix.
   * @evidence contracts/performance.md#reuse-equivalent-work Resident dirty and clean pages skip this callback until eviction.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The callback borrows one of the table's three existing buffers only during the call; the caller closes its descriptor independently.
   */
  read: (
    target: Buffer,
    offset: number,
    length: number,
    position: number,
  ) => number;

  /**
   * Write borrowed valid page bytes at an absolute address; return actual progress.
   *
   * @evidence contracts/common.md#principled-implementation Complete-progress loops persist the valid prefix before a dirty page can be reused.
   * @evidence contracts/common.md#clear-and-simple-design Descriptor ownership stays with the caller while dirty state stays with the table.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failure cannot become a successful flush or let another page overwrite the buffer.
   * @evidence contracts/common.md#meaningful-documentation States borrowed bytes, absolute addresses and actual progress rather than requested length.
   * @evidence contracts/performance.md#efficient-algorithms A callback writes at most the remainder of one valid page prefix.
   * @evidence contracts/performance.md#reuse-equivalent-work Repeated updates accumulate in one owned page before the required eviction or finish flush.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The callback retains neither the page nor another buffer; the caller owns independent descriptor closure.
   */
  write: (
    source: Buffer,
    offset: number,
    length: number,
    position: number,
  ) => number;
}
