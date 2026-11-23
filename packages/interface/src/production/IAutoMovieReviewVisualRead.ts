import type { IAutoMovieGrammarDiagnostic } from "../cinematics/IAutoMovieGrammarDiagnostic";
import type { IAutoMovieShot } from "../cinematics/IAutoMovieShot";
import type { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import type { IAutoMovieScene } from "../scene/IAutoMovieScene";

/** Data and callback contracts shared by the ReviewVisualRead operations. */
export namespace IAutoMovieReviewVisualRead {
  /**
   * Engine-computed visual-read metrics for one compiled shot, filed as
   * advisory `tier: "visual"` review notes after any film-grammar findings
   * passed in. They never fail a gate; they give the review backlog measurable
   * facts about whether the action reads.
   *
   * Every metric reads a performer's world root: its performance's motion
   * sampled at `max(0, t - startOffset)` and folded through its staged node. A
   * performance whose node or motion is missing, or that plays no motion, is
   * skipped.
   *
   * - **Subject in frame**: sampled at `sampleRate` from 0 to the shot's end, a
   *   performer whose root leaves the live camera's frustum, behind the near
   *   plane, past the far plane, or outside the vertical field of view and the
   *   `aspect`-derived horizontal one, gets one note at the first such time.
   * - **Silhouette separation**: at the same times, two performers whose angular
   *   separation from the camera is smaller than the sum of their angular
   *   radii, `atan(silhouetteRadius / distance)` each, get one note at the
   *   first such time; a pair with either root nearer than the near plane at
   *   that time is left to the framing metric.
   * - **Contact connection**: a `hit` or `contact` event with a point and a
   *   target whose performer's root lies farther than `contactRadius` from the
   *   point at the event time gets one note.
   *
   * The first two metrics need a live camera with a finite field of view in
   * `(0, 180)` degrees and `far > near`; without one they are skipped. A root
   * is a point, so a subject whose body is in frame while its root is not is
   * reported; that approximation holds for all three metrics.
   */
  export type IProps = {
    /** Beat id the notes are filed against. */
    beat: string;

    /** Staged scene whose nodes and cameras the shot plays over. */
    scene: IAutoMovieScene;

    /** The compiled shot: camera, its motion, performances, events, duration. */
    shot: IAutoMovieShot;

    /** Motions the shot's performances reference. */
    motions: readonly IAutoMovieMotion[];

    /** Samples per second. Defaults to 12. */
    sampleRate?: number;

    /** Render aspect (width / height). Defaults to 16 / 9. */
    aspect?: number;

    /** Body radius in metres a contact point must land within. Defaults to 1. */
    contactRadius?: number;

    /** Silhouette half-width in metres for the merge check. Defaults to 0.35. */
    silhouetteRadius?: number;

    /**
     * Film-grammar findings for this shot or its incoming cut, filed before
     * visual-read notes.
     */
    grammarDiagnostics?: readonly IAutoMovieGrammarDiagnostic[];
  };
}
