/*
 * Declare borrowed positional I/O for one exclusive binary64 vector table.
 * The caller owns the descriptor and closes it after finish or failure. Callback
 * buffers are borrowed only during a call; byte counts report actual progress.
 */
export interface RecoveryFileVectorTableInput {
  /*
   * Positive logical row ceiling, safely representable as rowCount times 24 bytes.
   */
  maxRows: number;

  /*
   * Read existing exclusive backing bytes into a borrowed page; return progress.
   */
  read: (
    target: Buffer,
    offset: number,
    length: number,
    position: number,
  ) => number;

  /*
   * Write borrowed valid page bytes at an absolute address; return actual progress.
   */
  write: (
    source: Buffer,
    offset: number,
    length: number,
    position: number,
  ) => number;
}
