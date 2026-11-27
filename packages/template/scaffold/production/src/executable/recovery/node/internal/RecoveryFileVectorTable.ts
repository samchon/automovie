/*
 * Expose logical vector rows and explicit completion for one private table.
 * Reads copy triples, while ordered writes may remain in resident dirty pages.
 * Finish completes backing bytes but does not close the caller's descriptor.
 * The first failed value remains terminal, including null or undefined.
 */
export interface RecoveryFileVectorTable {
  /*
   * Append one finite triple at the next logical row; failures terminally latch.
   */
  append: (value: readonly number[]) => void;

  /*
   * Copy an existing logical triple, including its current dirty values.
   */
  read: (index: number) => [number, number, number];

  /*
   * Replace an existing row after all three finite values have been admitted.
   */
  update: (index: number, value: readonly number[]) => void;

  /*
   * Flush valid dirty prefixes, then forbid row access; successful calls repeat safely.
   */
  finish: () => void;

  /*
   * Copy call-local logical population, allocated bytes, transfer counts and state.
   */
  statistics: () => {
    /*
     * Admitted logical rows, independently of current backing-file length.
     */
    rows: number;

    /*
     * Actual allocated reusable page bytes, including unused page capacity.
     */
    allocatedPageBytes: number;

    /*
     * Attempted read callback calls, including short or failed transfers.
     */
    readTransfers: number;

    /*
     * Attempted write callback calls, including short or failed transfers.
     */
    writeTransfers: number;

    /*
     * True only after all required valid-prefix flushes succeeded.
     */
    finished: boolean;

    /*
     * True after the first terminal row or transfer failure.
     */
    failed: boolean;
  };
}
