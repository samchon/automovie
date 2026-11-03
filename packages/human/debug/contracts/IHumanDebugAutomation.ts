import type { IHumanDebugSnapshot } from "./IHumanDebugSnapshot";

/**
 * The page's automation handle, `window.__humanDebug`, which the capture session drives.
 *
 * `ready` settles after the first frame of the URL the page opened with; `apply` loads the subject
 * the search text names when it differs from the shown one, applies every option and resolves after
 * the next drawn frame; `snapshot` reads the current state without drawing.
 */
export interface IHumanDebugAutomation {
  /** Settles with the first frame's snapshot. */
  ready: Promise<IHumanDebugSnapshot>;

  /**
   * Apply a search text and draw.
   *
   * @param search Search text without `?`.
   * @returns The snapshot after the draw.
   */
  apply(search: string): Promise<IHumanDebugSnapshot>;

  /** The current snapshot. */
  snapshot(): IHumanDebugSnapshot;
}
