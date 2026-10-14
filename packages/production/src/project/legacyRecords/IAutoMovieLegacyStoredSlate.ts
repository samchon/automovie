import type { IAutoMovieBeatEndState, IAutoMovieReviewNote, IAutoMovieScene, IAutoMovieScript, IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";

/**
 * Committed resident-store slices with an optional assembled film.
 *
 * The historical read boundary omitted film; the writable form requires the
 * slot. AutoMovieProject reads these slices and the legacy importer inventories
 * them. The retired read/commit protocol is not an active consumer.
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
   * Committed script, or null before SCRIPT exists.
   */
  script: IAutoMovieScript | null;

  /**
   * Committed staged scenes, keyed by their own `id`, empty before STAGING.
   *
   * Plural because a film is not one location. The script tree already authors
   * several `scene` nodes with their own INT/EXT and location, and every shot
   * already names the scene it renders through {@link IAutoMovieShot.scene},
   * which `validateShotArtifact` enforces. The slate held one scene, so the
   * production layer collapsed a screenplay to a single set (#1171).
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
   * Open review notes.
   */
  notes: IAutoMovieReviewNote[];

  /**
   * Optional assembled film; the writable form requires this slot and uses
   * null before assembly.
   */
  film?: IAutoMovieSequence | null;
}
