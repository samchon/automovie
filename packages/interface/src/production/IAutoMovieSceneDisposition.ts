/** Explicit scene omission in a phase-local coverage ledger. */
export interface IAutoMovieSceneDisposition {
  /** Workflow phase whose output intentionally omits the scene. */
  phase: "screenplay" | "production" | "edit";

  /**
   * Auditable reason the scene does not require a realized shot in this phase.
   */
  reason: string;
}
