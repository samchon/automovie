import type { IAutoMovieClip } from "../core/IAutoMovieClip";
import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import type { IAutoMovieFormationMotion } from "../production/IAutoMovieFormationMotion";
import type { IAutoMoviePerformShotCoverageJob } from "../production/IAutoMoviePerformShotCoverageJob";
import type { IAutoMoviePerformShotFrameJob } from "../production/IAutoMoviePerformShotFrameJob";
import type { IAutoMoviePerformShotProps } from "../production/IAutoMoviePerformShotProps";
import type { IAutoMovieCameraClearanceRuntime } from "./IAutoMovieCameraClearanceRuntime";

/**
 * Camera-stage inputs after performance actions and couplings have been
 * admitted.
 */
export namespace IAutoMovieCompilePerformShotCameras {
  /**
   * Finalized shot data borrowed by compilePerformShotCameras to produce hero
   * movement, lens intent, alternate takes and clearance reports.
   *
   * The live camera's `frame` moves, already sorted by start, compile through
   * {@link compileCameraMove} into the clip `cam:<scope>`; with no move the
   * camera is locked off and the clip is null. Each move's intent carries its
   * framing, move, focal length and focus, the focus resolved to the world
   * point the input gate accepted; the solve never reads the intent, a render
   * host does. Each coverage job plays its one framing across the whole beat
   * from its own staged camera, as the clip `cam:<scope>:<camera>`, so a host
   * can cut to the angle at any instant, with no focus or focal length invented
   * for it. Every subject is measured by one
   * {@link createPerformShotSubjectFramer}, so hero and coverage frame the same
   * subject. {@link compileCameraClearanceReports} then reports any take whose
   * physical envelope is obstructed into the context's collector.
   */
  export type IProps = {
    /**
     * Id of the staged camera elected by gatePerformShotCamera; this compiler
     * assumes the lookup succeeds.
     */
    liveCamera: string;

    /**
     * Admitted hero moves sorted by action.start in shot-local seconds; empty
     * leaves the camera locked off and intent empty.
     */
    frames: readonly IAutoMoviePerformShotFrameJob[];

    /**
     * Admitted alternate camera jobs in authored order, each covering the
     * entire shot. Empty requests no alternate takes.
     */
    coverageJobs: readonly IAutoMoviePerformShotCoverageJob[];

    /**
     * Clip-id suffix, normally the shot id or otherwise beat id; used verbatim
     * in cam:<scope> and coverage ids.
     */
    scope: string;

    /**
     * Delivery raster and clock as `performShot` received them. Its width over
     * height is the framing aspect, and undefined or a non-positive side uses
     * the camera compiler's square fit. Its exact `fps` and `frameRate` key the
     * moving camera paths; without `fps` the compiler's 24 fps fallback
     * applies, and a rate `resolveProductionFrameRate` refuses is a `range`
     * violation at `$input.frameFormat.fps`.
     */
    frameFormat: IAutoMoviePerformShotProps["frameFormat"];

    /**
     * Portable staged model catalogue. Undefined behaves as an empty catalogue:
     * framing may use rig/default bounds, while envelope clearance refuses
     * unmeasurable staged obstacles.
     */
    models: readonly IAutoMovieModel[] | undefined;

    /**
     * Compact formation cues on the shot clock, used when measuring and
     * following group subjects; empty keeps groups at their opening placement.
     */
    formationMotions: readonly IAutoMovieFormationMotion[];

    /**
     * Final actor motions by node id, read without mutation after coupling;
     * absent entries contribute no actor motion.
     */
    motions: Record<string, IAutoMovieMotion>;

    /**
     * Final object clips in producer/channel-authority order, sampled on the
     * shot clock for framing and clearance.
     */
    objectMotions: readonly IAutoMovieClip[];

    /**
     * Staged node world-facing quaternions, used to place actor root movement;
     * a missing facing prevents the actor-motion following branch.
     */
    rotations: ReadonlyMap<string, IAutoMovieQuaternion>;

    /**
     * Builder-owned geometry revision and clearance clock; required only when a
     * selected camera declares an envelope.
     */
    runtime: IAutoMovieCameraClearanceRuntime | undefined;
  };
}
