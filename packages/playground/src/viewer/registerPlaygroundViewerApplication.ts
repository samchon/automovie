import type { IPlaygroundViewerApplication } from "./IPlaygroundViewerApplication";
import type {} from "./IPlaygroundViewerPage";

/**
 * Supply the editor's existing validated transaction to the normal page host.
 * A standalone/offline page has no host and keeps its ordinary behavior.
 * No editor, document evaluator or renderer is cloned by this registration.
 */
export function registerPlaygroundViewerApplication(application: IPlaygroundViewerApplication): void {
  window.__playgroundViewerPage?.register(application);
}
