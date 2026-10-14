import type { IAutoMovieBeatEndState, IAutoMovieReviewNote, IAutoMovieScene, IAutoMovieScript, IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";

/**
 * Legacy resident-store slices with an optional assembled-film slot. AutoMovieProject reads script, scenes, shots, beat ends and notes, while its writable form requires a nullable film field. These records preserve the historical layout without an active read/commit tool or an atomic cross-file snapshot.
 *
 * @evidence contracts/common.md#principled-implementation The resident store assembles committed script, scenes, shots, beat ends and notes; optional film preserves the historical read/writable distinction without certifying slice consistency.
 * @evidence contracts/common.md#clear-and-simple-design LegacyWritableSlate makes film required for AutoMovieProject writableSlate and saveSlate; individual store methods own disk observation and admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing script remains null and empty collections remain empty; this type promises no surviving protocol read tool.
 * @evidence contracts/common.md#meaningful-documentation States slice identities, pre-commit empty/null states and optional film compatibility.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Read-state fields aggregate no slices; the resident store owns per-file observation and validation costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A slate shape promises no retained gate answer and readers establish currentness independently.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The slate value retains slice arrays and nullable script while file readers own disk-handle cleanup.
 * @author Samchon
 */
export interface IAutoMovieLegacyStoredSlate {
  /**
   * Admitted script, or null for absent bytes or parsed JSON null.
   */
  script: IAutoMovieScript | null;

  /**
   * Admitted keyed scenes in filename order, or the historical scene.json fallback when no keyed scene contributes; empty means neither yields a scene.
   */
  scenes: IAutoMovieScene[];

  /**
   * Shots built so far.
   */
  shots: IAutoMovieShot[];

  /**
   * Resolved end-state snapshots for built beats.
   */
  beatEnds: IAutoMovieBeatEndState[];

  /**
   * All admitted stored review notes; the resident reader does not filter an open/closed status.
   */
  notes: IAutoMovieReviewNote[];

  /**
   * Optional assembled film; the writable form requires this slot and uses null before assembly.
   */
  film?: IAutoMovieSequence | null;
}
