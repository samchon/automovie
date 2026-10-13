import type { IPlaygroundViewerApplication } from "./IPlaygroundViewerApplication";
import type {} from "./IPlaygroundViewerPage";

/**
 * Supply the editor's existing validated transaction to the normal page host.
 * A standalone/offline page has no host and keeps its ordinary behavior.
 * No editor, document evaluator or renderer is cloned by this registration.
 *
 * @evidence contracts/common.md#principled-implementation The application retains validation and committed input ownership during transfer.
 * @evidence contracts/common.md#clear-and-simple-design One registration links the existing page bridge and application transaction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not infer documents from widgets, inject events or replace SDK methods.
 * @evidence contracts/common.md#meaningful-documentation Defines optional host integration and unchanged standalone ownership.
 */
export function registerPlaygroundViewerApplication(application: IPlaygroundViewerApplication): void {
  window.__playgroundViewerPage?.register(application);
}
