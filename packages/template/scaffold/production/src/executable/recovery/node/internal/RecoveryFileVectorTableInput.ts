/**
 * Declare borrowed positional I/O for one exclusive binary64 vector table.
 * The caller owns the descriptor and closes it after finish or failure. Callback
 * buffers are borrowed only during a call; byte counts report actual progress.
 *
 * @evidence contracts/development/design.md#principled-representation The row ceiling counts binary64 triples. Callback addresses and progress count bytes. The contour sink supplies the ceiling and uses fs.readSync and fs.writeSync on its descriptors. Integer limits, integer progress and borrowed-buffer lifetime are caller obligations beyond the table's comparisons.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This erased input separates caller descriptor ownership from the table's private pages and logical state.
 * @evidence contracts/development/common.md#meaningful-documentation States row-count admission, absolute byte addressing, progress and borrowed-buffer/descriptor lifetimes.
 */
export interface RecoveryFileVectorTableInput {
  /** Positive logical row ceiling, safely representable as rowCount times 24 bytes. */
  maxRows: number;

  /**
   * Read existing exclusive backing bytes into a borrowed page; return progress.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The contour sink delegates to fs.readSync with an absolute position and a borrowed page. Native integer progress drives the table's partial-read loop and a zero return fails while bytes remain.
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
   * @evidence contracts/development/implementation.md#principled-implementation The contour sink delegates to fs.writeSync. Given its integer progress, the table completes the valid prefix before a dirty page can be reused. A thrown write error or detected progress failure remains terminal.
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
