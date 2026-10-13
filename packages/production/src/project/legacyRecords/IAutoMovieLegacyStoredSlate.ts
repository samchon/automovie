/**
 * Legacy project record boundary. The stored format preserves its existing
 * identities and units; runtime consumers use the same declared fields.
 */
import type { IAutoMovieBeatEndState, IAutoMovieReviewNote, IAutoMovieScene, IAutoMovieScript, IAutoMovieSequence, IAutoMovieShot } from "@automovie/interface";

/**
 * Records the v1 legacy project store reads and writes.
 *
 * These were part of a protocol payload module that no longer exists. Only the
 * legacy import path reads them, so they live beside it rather than in a
 * package-wide surface nothing else consumes.
 */

/**
 * The committed slices a READ tool needs: everything but the assembled film.
 *
 * `film` is declared here as optional rather than omitted, because every
 * producer of a slate emits the writable form and the documented loop is
 * commit-then-read: `commitScene`'s echoed slate goes straight back into
 * `getScene`. Tool inputs are validated with `validateEquals` (#1340), so a
 * property the parameter does not declare is refused, and leaving `film`
 * undeclared would have broken that round trip at the boundary. Declaring it
 * optional accepts both forms and states the truth: a read of the script, the
 * scene, a shot, the notes, or a beat end does not consult the film.
 *
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
   * Assembled film, or null before CUT has committed. Carried so a slate
   * returned by any tool can be passed straight back to a read tool; the reads
   * themselves never consult it.
   */
  film?: IAutoMovieSequence | null;
}
