/** What the last compile attempts left behind. */
export interface IHumanViewerCompilationStatus {
  /** The failure of the newest attempt, or null when it succeeded. */
  error: string | null;

  /**
   * When the newest successful compile of the human package finished, or null
   * before the first. It moves only when `packages/human` changes. An edit to
   * the viewer page or the test layer changes `serving.revision` without moving
   * this time, because the human compile is not rerun for it.
   */
  goodAt: string | null;
}
