/**
 * Declare borrowed positional I/O for one exclusive binary64 vector table.
 * The caller owns the descriptor and closes it after finish or failure. Callback
 * buffers are borrowed only during a call; byte counts report actual progress.
 *
 * @evidence contracts/development/design.md#principled-representation Safe logical row ceilings and actual positional byte transfers preserve complete binary64 rows, partial I/O and EOF semantics.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This erased input separates caller descriptor ownership from the table's private pages and logical state.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Callbacks cannot retain borrowed pages, fabricate unread bytes or substitute another table; no geometry or arithmetic policy is added.
 * @evidence contracts/development/common.md#meaningful-documentation States row-count admission, absolute byte addressing, progress and borrowed-buffer/descriptor lifetimes.
 */
export interface RecoveryFileVectorTableInput {
  /** Positive logical row ceiling, safely representable as rowCount times 24 bytes. */
  maxRows: number;

  /**
   * Read existing exclusive backing bytes into a borrowed page; return progress.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Explicit absolute byte addresses and actual byte counts preserve partial-read and EOF semantics.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The caller owns the descriptor; the table owns progress and row validity.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The callback cannot retain or replace the borrowed page or fabricate unread bytes.
   * @evidence contracts/development/common.md#meaningful-documentation States borrowed buffer ownership, existing-byte reads and returned progress.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each callback reads at most the remainder of one valid page prefix.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Resident dirty and clean pages skip this callback until eviction.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The callback borrows one of the table's three existing buffers only during the call; the caller closes its descriptor independently.
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
   * @evidence contracts/development/implementation.md#principled-implementation Complete-progress loops persist the valid prefix before a dirty page can be reused.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Descriptor ownership stays with the caller while dirty state stays with the table.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Failure cannot become a successful flush or let another page overwrite the buffer.
   * @evidence contracts/development/common.md#meaningful-documentation States borrowed bytes, absolute addresses and actual progress rather than requested length.
   * @evidence contracts/development/implementation.md#efficient-algorithms A callback writes at most the remainder of one valid page prefix.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Repeated updates accumulate in one owned page before the required eviction or finish flush.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The callback retains neither the page nor another buffer; the caller owns independent descriptor closure.
   */
  write: (
    source: Buffer,
    offset: number,
    length: number,
    position: number,
  ) => number;
}
