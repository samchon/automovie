

/**
 * Create a path-specific refusal requiring preservation of current production work when the applied import no longer matches its admitted state. This message does not by itself prove which underlying read or comparison failed.
 *
 * @evidence contracts/common.md#principled-implementation Names the exact relative member and state root whose untouched-import premise failed, aligning refusal with rollback's work-preservation boundary.
 * @evidence contracts/common.md#clear-and-simple-design One refusal representation is shared by topology traversal and rollback admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not perform deletion or invent a recovered state; underlying detailed causes are not supplied to this established message-only factory.
 * @evidence contracts/common.md#meaningful-documentation Documents preservation guidance and the limit of what this refusal explains.
 * @evidence contracts/performance.md#efficient-algorithms Constructs one message in root/relative-path character length with one returned Error.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares refusal wording but creates a separate error per changed-state event rather than caching failure by path.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one error value and acquires no descriptor, lock or retained filesystem task.
 */
export const legacyImporterChangedImportError: (stateRoot: string, relative: string) => Error = (stateRoot: string, relative: string): Error =>
  new Error(
    `Applied legacy import path "${relative}" under "${stateRoot}" changed after import. Preserve current production work; rollback refused.`,
  );
