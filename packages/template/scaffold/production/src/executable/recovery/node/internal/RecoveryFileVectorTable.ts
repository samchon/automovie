/**
 * Expose logical vector rows and explicit completion for one private table.
 * Reads copy triples, while ordered writes may remain in resident dirty pages.
 * Finish completes backing bytes but does not close the caller's descriptor.
 * The first failed value remains terminal, including null or undefined.
 *
 * @evidence contracts/development/design.md#principled-representation Distinct append/read/update/finish methods preserve logical row admission, complete binary64 values and first-failure identity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This erased result names the table's lifecycle seam without exposing pages or transferring descriptor ownership.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No cache buffer escapes, no nonexistent row is fabricated and completion is not canonical model or process-memory qualification.
 * @evidence contracts/development/common.md#meaningful-documentation States copied values, delayed flushes, terminal errors, idempotent successful finish and independent descriptor close.
 */
export interface RecoveryFileVectorTable {
  /**
   * Append one finite triple at the next logical row; failures terminally latch.
   *
   * @evidence contracts/development/implementation.md#principled-implementation All three scalars are copied and admitted before mutation; the logical count advances only after storage succeeds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Append alone creates rows and enforces the declared population ceiling.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No skipped row, fabricated padding or partially admitted vector becomes data.
   * @evidence contracts/development/common.md#meaningful-documentation States finite-triple admission, next-row addressing and terminal failure.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three encodings follow bounded page lookup. A miss can flush one dirty victim and read one existing valid prefix; short I/O can require multiple callbacks per transfer.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Sequential appends reuse the current dirty page.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The input is borrowed only during the call; the table retains at most three private pages.
   */
  append: (value: readonly number[]) => void;

  /**
   * Copy an existing logical triple, including its current dirty values.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Row admission precedes lookup and little-endian decoding preserves binary64 values.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The copied result grants no access to private cache storage.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts File padding and nonexistent rows cannot supply values.
   * @evidence contracts/development/common.md#meaningful-documentation States existing-row, copied-result and dirty-value semantics.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three decodings follow bounded page lookup. A miss can flush one dirty victim and read one valid prefix; short I/O can require multiple callbacks per transfer.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A resident page supplies its latest values without another read.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One three-scalar result transfers to the caller and no cache buffer escapes.
   */
  read: (index: number) => [number, number, number];

  /**
   * Replace an existing row after all three finite values have been admitted.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Whole-triple admission precedes mutation and ordered subsequent reads see the replacement.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Update cannot change logical population or create an address.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No grouped reduction or scalar conversion changes caller arithmetic.
   * @evidence contracts/development/common.md#meaningful-documentation States whole-triple mutation and existing-row restriction.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three encodings follow bounded page lookup. A miss can flush one dirty victim and read one valid prefix; short I/O can require multiple callbacks per transfer.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The owned dirty page retains the latest replacement until flush.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A transient copied triple and at most three cache pages are retained.
   */
  update: (index: number, value: readonly number[]) => void;

  /**
   * Flush valid dirty prefixes, then forbid row access; successful calls repeat safely.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Success follows every required flush; the first failed value, including undefined, remains terminal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure This method completes backing bytes while the caller separately owns descriptor close.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Neither finish failure nor unfinished backing grants output qualification.
   * @evidence contracts/development/common.md#meaningful-documentation States flush-before-success, idempotence, terminal row access and separate close ownership.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most three dirty valid page prefixes are traversed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Already clean pages and repeated successful finish perform no transfer.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Buffers expire with the table owner after this call or failure; no descriptor is acquired or closed here.
   */
  finish: () => void;

  /**
   * Copy call-local logical population, allocated bytes, transfer counts and state.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Counters describe actual attempted transfers and logical rows, not uncommitted file length.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Observation returns immutable-by-copy scalar metadata without exposing pages.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Statistics do not certify model completion, peak process memory or speedup.
   * @evidence contracts/development/common.md#meaningful-documentation States local counter meanings and absence of buffer ownership transfer.
   * @evidence contracts/development/implementation.md#efficient-algorithms Copies six scalar fields in constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Existing counters are observed without rereading or flushing backing.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One small result transfers to the caller without retaining cache references.
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
