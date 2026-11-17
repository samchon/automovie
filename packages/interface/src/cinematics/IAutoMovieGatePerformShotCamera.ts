import type { IAutoMovieBlockingCoverage } from "../authoring/IAutoMovieBlockingCoverage";
import type { IAutoMoviePerformShotCoverageJob } from "../production/IAutoMoviePerformShotCoverageJob";
import type { IAutoMoviePerformShotFrameJob } from "../production/IAutoMoviePerformShotFrameJob";

/**
 * Camera election inputs and provisional jobs returned by the performShot camera gate.
 *
 * @evidence contracts/development/design.md#principled-representation IProps distinguishes an absent election from an id; IResult carries partial output whose admission is determined by the context collector.
 * @evidence contracts/development/design.md#minimal-and-owned-surface These records connect performShot's action pass to camera compilation using canonical frame/coverage jobs.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The result is not a success union because numerical findings can coexist with jobs; callers must check the documented collector.
 * @evidence contracts/development/common.md#meaningful-documentation The two contracts separate borrowed requests, fallback selection and mutable partial results.
 */
export namespace IAutoMovieGatePerformShotCamera {
  /**
   * Borrowed camera election and coverage requests checked against the gate context's staged scene.
   * 
   * 1. Without an elected camera, the scene's first camera is live and locked off, its id gated as non-blank because it becomes `shot.camera`; a scene with no camera cannot be framed.
   * 2. Each coverage intent must name a staged camera that is neither the live camera nor one an earlier intent named, state a usable framing and move, and favour a subject that resolves; a coverage camera never becomes a second live camera.
   * 3. The live camera, when a `frame` action moves it, and every coverage camera must have a vertical field of view in `(0, 180)` degrees and a finite position, because the framing solve divides by `tan(fovY / 2)`; a camera whose move is a `whip` must also carry a finite rotation, since a whip pans from it. An unused degenerate camera fails nothing.
   *
   * @evidence contracts/development/design.md#principled-representation Null denotes no elected live camera, and arrays retain authored action/coverage order. gatePerformShotCamera appends id, target, vocabulary and camera-domain failures to the context collector; its returned jobs alone do not establish admission.
   * @evidence contracts/development/design.md#minimal-and-owned-surface performShot supplies its already gathered frame jobs and blocking coverage; staged tables and diagnostics stay in the separate shared gate context.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The first staged camera is the explicit fallback only when no action elected one; no second live camera is synthesized for coverage.
   * @evidence contracts/development/common.md#meaningful-documentation States null/empty meanings, fallback order, camera-domain checks and collector-based failure handling.
   */
  export type IProps = {
      /** Camera id elected by the frame-action pass, or null to request the first staged camera as a locked-off fallback. */
      liveCamera: string | null;

      /** Hero frame jobs; nonempty enables camera lens/position checks, and any whip also requires finite quaternion components. */
      frames: readonly IAutoMoviePerformShotFrameJob[];

      /** Authored alternate-take intents in order; empty yields no coverage jobs. Targets are resolved at shot-local second zero. */
      coverage: readonly IAutoMovieBlockingCoverage[];
    };

  /**
   * Provisional camera selection and coverage jobs; read the context collector before compiling them.
   *
   * Coverage jobs satisfy staged-camera lookup, distinct-camera, vocabulary and resolved-target conditions. Id validation and the later lens/position/whip checks can still append failures without removing a job. performShot stops on those findings. The result and jobs array are fresh and mutable; each job borrows its original intent and staged camera.
   *
   * @evidence contracts/development/design.md#principled-representation Null liveCamera records that no elected or fallback camera exists; a non-null id or nonempty jobs array is not a success discriminant. Numerical camera validity remains in the separate collector.
   * @evidence contracts/development/design.md#minimal-and-owned-surface These are the two values performShot forwards after checking the collector; coverage jobs reuse canonical intent/camera records instead of copying scene state.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Partial results are explicit and are never documented as a certificate of camera validity; rejected duplicate or unresolved coverage entries do not receive substitutes.
   * @evidence contracts/development/common.md#meaningful-documentation Defines partial-result semantics, the caller's failure check and shallow ownership of returned jobs.
   */
  export type IResult = {
    /** Elected id or first staged id; null remains when neither exists. Id/domain findings may coexist with a non-null value. */
    liveCamera: string | null;

    /** Fresh ordered job array for coverage entries passing structural selection; borrowed cameras may still have numerical findings in the collector. */
    coverageJobs: IAutoMoviePerformShotCoverageJob[];
  };
}
