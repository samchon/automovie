import type { IAutoMovieBlockingCoverage } from "../authoring/IAutoMovieBlockingCoverage";
import type { IAutoMoviePerformShotCoverageJob } from "../production/IAutoMoviePerformShotCoverageJob";
import type { IAutoMoviePerformShotFrameJob } from "../production/IAutoMoviePerformShotFrameJob";

/**
 * Camera election inputs and provisional jobs returned by the performShot
 * camera gate.
 */
export namespace IAutoMovieGatePerformShotCamera {
  /**
   * Borrowed camera election and coverage requests checked against the gate
   * context's staged scene.
   *
   * 1. Without an elected camera, the scene's first camera is live and locked off,
   *    its id gated as non-blank because it becomes `shot.camera`; a scene with
   *    no camera cannot be framed.
   * 2. Each coverage intent must name a staged camera that is neither the live
   *    camera nor one an earlier intent named, state a usable framing and move,
   *    and favour a subject that resolves; a coverage camera never becomes a
   *    second live camera.
   * 3. The live camera, when a `frame` action moves it, and every coverage camera
   *    must have a vertical field of view in `(0, 180)` degrees and a finite
   *    position, because the framing solve divides by `tan(fovY / 2)`; a camera
   *    whose move is a `whip` must also carry a finite rotation, since a whip
   *    pans from it. An unused degenerate camera fails nothing.
   */
  export type IProps = {
    /**
     * Camera id elected by the frame-action pass, or null to request the first
     * staged camera as a locked-off fallback.
     */
    liveCamera: string | null;

    /**
     * Hero frame jobs; nonempty enables camera lens/position checks, and any
     * whip also requires finite quaternion components.
     */
    frames: readonly IAutoMoviePerformShotFrameJob[];

    /**
     * Authored alternate-take intents in order; empty yields no coverage jobs.
     * Targets are resolved at shot-local second zero.
     */
    coverage: readonly IAutoMovieBlockingCoverage[];
  };

  /**
   * Provisional camera selection and coverage jobs; read the context collector
   * before compiling them.
   *
   * Coverage jobs satisfy staged-camera lookup, distinct-camera, vocabulary and
   * resolved-target conditions. Id validation and the later lens/position/whip
   * checks can still append failures without removing a job. performShot stops
   * on those findings. The result and jobs array are fresh and mutable; each
   * job borrows its original intent and staged camera.
   */
  export type IResult = {
    /**
     * Elected id or first staged id; null remains when neither exists.
     * Id/domain findings may coexist with a non-null value.
     */
    liveCamera: string | null;

    /**
     * Fresh ordered job array for coverage entries passing structural
     * selection; borrowed cameras may still have numerical findings in the
     * collector.
     */
    coverageJobs: IAutoMoviePerformShotCoverageJob[];
  };
}
