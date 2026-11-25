/**
 * Expose logical vector rows and explicit completion for one private table.
 * Reads copy triples, while ordered writes may remain in resident dirty pages.
 * Finish completes backing bytes but does not close the caller's descriptor.
 * The first failed value remains terminal, including null or undefined.
 *
 * @evidence contracts/development/design.md#principled-representation Append, read, update and finish express logical binary64 rows and first-failure identity. The caller supplies integer row addresses and finite triples. The implementation checks address range and triple length and leaves those other premises to the caller.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This erased result names the table's lifecycle seam without exposing pages or transferring descriptor ownership.
 * @evidence contracts/development/common.md#meaningful-documentation States copied values, delayed flushes, terminal errors, idempotent successful finish and independent descriptor close.
 */
export interface RecoveryFileVectorTable {
  /**
   * Append one finite triple at the next logical row; failures terminally latch.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The table checks triple length and copies the elements before storage. The logical count advances after the next row is written. The caller supplies finite numbers, since binary64 encoding also accepts nonfinite values.
   * @evidence contracts/development/implementation.md#efficient-algorithms Append alone creates rows and enforces the declared population ceiling. Three encodings follow bounded page lookup. A miss can flush one dirty victim and read one existing valid prefix; short I/O can require multiple callbacks per transfer. Sequential appends reuse the current dirty page. The input is borrowed only during the call; the table retains at most three private pages.
   * @evidence contracts/development/common.md#meaningful-documentation States finite-triple admission, next-row addressing and terminal failure.
   */
  append: (value: readonly number[]) => void;

  /**
   * Copy an existing logical triple, including its current dirty values.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The table checks the address range before little-endian decoding. An integer address selects one existing row. Fractional indices inside that range can address between binary64 fields.
   * @evidence contracts/development/implementation.md#efficient-algorithms The copied result grants no access to private cache storage. Three decodings follow bounded page lookup. A miss can flush one dirty victim and read one valid prefix; short I/O can require multiple callbacks per transfer. A resident page supplies its latest values without another read. One three-scalar result transfers to the caller and no cache buffer escapes.
   * @evidence contracts/development/common.md#meaningful-documentation States existing-row, copied-result and dirty-value semantics.
   */
  read: (index: number) => [number, number, number];

  /**
   * Replace an existing row after all three finite values have been admitted.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Address-range and triple-length checks precede mutation. Ordered reads at the caller's integer address see the written binary64 values. The caller supplies finite numbers.
   * @evidence contracts/development/implementation.md#efficient-algorithms Update cannot change logical population or create an address. Three encodings follow bounded page lookup. A miss can flush one dirty victim and read one valid prefix; short I/O can require multiple callbacks per transfer. The owned dirty page retains the latest replacement until flush. A transient copied triple and at most three cache pages are retained.
   * @evidence contracts/development/common.md#meaningful-documentation States whole-triple mutation and existing-row restriction.
   */
  update: (index: number, value: readonly number[]) => void;

  /**
   * Flush valid dirty prefixes, then forbid row access; successful calls repeat safely.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Success follows every required flush; the first failed value, including undefined, remains terminal. Neither finish failure nor unfinished backing grants output qualification.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most three dirty valid page prefixes are traversed. Clean pages and repeated successful finish perform no transfer. The table retains its pages until the caller releases the table. The caller closes the descriptor separately.
   * @evidence contracts/development/common.md#meaningful-documentation States flush-before-success, idempotence, terminal row access and separate close ownership.
   */
  finish: () => void;

  /**
   * Copy call-local logical population, allocated bytes, transfer counts and state.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Counters describe actual attempted transfers and logical rows, not uncommitted file length. Statistics do not certify model completion, peak process memory or speedup.
   * @evidence contracts/development/implementation.md#efficient-algorithms Observation returns immutable-by-copy scalar metadata without exposing pages. Copies six scalar fields in constant work. Existing counters are observed without rereading or flushing backing. One small result transfers to the caller without retaining cache references.
   * @evidence contracts/development/common.md#meaningful-documentation States local counter meanings and absence of buffer ownership transfer.
   */
  statistics: () => {
    /** Admitted logical rows, independently of current backing-file length. */
    rows: number;

    /** Actual allocated reusable page bytes, including unused page capacity. */
    allocatedPageBytes: number;

    /** Attempted read callback calls, including short or failed transfers. */
    readTransfers: number;

    /** Attempted write callback calls, including short or failed transfers. */
    writeTransfers: number;

    /** True only after all required valid-prefix flushes succeeded. */
    finished: boolean;

    /** True after the first terminal row or transfer failure. */
    failed: boolean;
  };
}
