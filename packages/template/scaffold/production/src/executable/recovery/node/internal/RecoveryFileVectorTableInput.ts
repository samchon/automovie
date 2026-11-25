/**
 * Declare borrowed positional I/O for one exclusive binary64 vector table.
 * The caller owns the descriptor and closes it after finish or failure. Callback
 * buffers are borrowed only during a call; byte counts report actual progress.
 *
 * @evidence contracts/development/design.md#principled-representation Safe logical row ceilings and actual positional byte transfers preserve complete binary64 rows, partial I/O and EOF semantics. Callbacks cannot retain borrowed pages, fabricate unread bytes or substitute another table; no geometry or arithmetic policy is added.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This erased input separates caller descriptor ownership from the table's private pages and logical state.
 * @evidence contracts/development/common.md#meaningful-documentation States row-count admission, absolute byte addressing, progress and borrowed-buffer/descriptor lifetimes.
 */
export interface RecoveryFileVectorTableInput {
  /** Positive logical row ceiling, safely representable as rowCount times 24 bytes. */
  maxRows: number;

  /**
   * Read existing exclusive backing bytes into a borrowed page; return progress.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Explicit absolute byte addresses and actual byte counts preserve partial-read and EOF semantics. The callback cannot retain or replace the borrowed page or fabricate unread bytes.
   * @evidence contracts/development/implementation.md#efficient-algorithms The caller owns the descriptor; the table owns progress and row validity. Each callback reads at most the remainder of one valid page prefix. Resident dirty and clean pages skip this callback until eviction. The callback borrows one of the table's three existing buffers only during the call; the caller closes its descriptor independently.
   * @evidence contracts/development/common.md#meaningful-documentation States borrowed buffer ownership, existing-byte reads and returned progress.
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
   * @evidence contracts/development/implementation.md#principled-implementation Complete-progress loops persist the valid prefix before a dirty page can be reused. Failure cannot become a successful flush or let another page overwrite the buffer.
   * @evidence contracts/development/implementation.md#efficient-algorithms Descriptor ownership stays with the caller while dirty state stays with the table. A callback writes at most the remainder of one valid page prefix. Repeated updates accumulate in one owned page before the required eviction or finish flush. The callback retains neither the page nor another buffer; the caller owns independent descriptor closure.
   * @evidence contracts/development/common.md#meaningful-documentation States borrowed bytes, absolute addresses and actual progress rather than requested length.
   */
  write: (
    source: Buffer,
    offset: number,
    length: number,
    position: number,
  ) => number;
}
