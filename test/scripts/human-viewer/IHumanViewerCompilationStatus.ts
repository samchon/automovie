/** What the last compile attempts left behind. */
export interface IHumanViewerCompilationStatus {
  /** The failure of the newest attempt, or null when it succeeded. */
  error: string | null;

  /** When the newest successful generation finished, or null before the first. */
  goodAt: string | null;
}
