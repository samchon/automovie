import type { IAutoMovieClip } from "../core/IAutoMovieClip";
import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieMotion } from "../motion/IAutoMovieMotion";
import type { IAutoMovieFormationMotion } from "../production/IAutoMovieFormationMotion";
import type { IAutoMoviePerformShotCoverageJob } from "../production/IAutoMoviePerformShotCoverageJob";
import type { IAutoMoviePerformShotFrameJob } from "../production/IAutoMoviePerformShotFrameJob";
import type { IAutoMovieCameraClearanceRuntime } from "./IAutoMovieCameraClearanceRuntime";

/**
 * Camera-stage inputs after performance actions and couplings have been admitted.
 *
 * @evidence contracts/development/design.md#principled-representation IProps joins final motion on one shot clock with staged cameras and geometry; validation belongs to performShot and its delegated gates.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The camera stage consumes these fields for shared framing and clearance rather than receiving frontend state or a second scene representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing models and runtime keep their distinct framing-fallback and clearance-refusal meanings.
 * @evidence contracts/development/common.md#meaningful-documentation IProps documents clip identity, units, final-motion ordering and absence behavior.
 */
export namespace IAutoMovieCompilePerformShotCameras {
  /**
   * Finalized shot data borrowed by compilePerformShotCameras to produce hero movement, lens intent, alternate takes and clearance reports.
   *
   * The live camera's `frame` moves, already sorted by start, compile through {@link compileCameraMove} into the clip `cam:<scope>`; with no move the camera is locked off and the clip is null. Each move's intent carries its framing, move, focal length and focus, the focus resolved to the world point the input gate accepted; the solve never reads the intent, a render host does. Each coverage job plays its one framing across the whole beat from its own staged camera, as the clip `cam:<scope>:<camera>`, so a host can cut to the angle at any instant, with no focus or focal length invented for it. Every subject is measured by one {@link createPerformShotSubjectFramer}, so hero and coverage frame the same subject. {@link compileCameraClearanceReports} then reports any take whose physical envelope is obstructed into the context's collector.
   *
   * @evidence contracts/development/design.md#principled-representation All motion is on the context's shot-local seconds clock, placement uses world metres and focal length intent retains millimetres without driving the fovY solve. performShot owns admission and checks the collector after compilation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface performShot supplies final actor/object/formation motion and staged rotations to the shared subject framer, while the same models and runtime feed clearance; no rendering state is included.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing models permit the subject framer's rig/default-size fallbacks but do not excuse missing obstacle geometry during clearance; alternate takes receive null focus and focal length intent.
   * @evidence contracts/development/common.md#meaningful-documentation Describes clip naming, locked-off behavior, units, borrowed tables, model fallback and conditional runtime requirements.
   */
  export type IProps = {
    /** Id of the staged camera elected by gatePerformShotCamera; this compiler assumes the lookup succeeds. */
    liveCamera: string;

    /** Admitted hero moves sorted by action.start in shot-local seconds; empty leaves the camera locked off and intent empty. */
    frames: readonly IAutoMoviePerformShotFrameJob[];

    /** Admitted alternate camera jobs in authored order, each covering the entire shot. Empty requests no alternate takes. */
    coverageJobs: readonly IAutoMoviePerformShotCoverageJob[];

    /** Clip-id suffix, normally the shot id or otherwise beat id; used verbatim in cam:<scope> and coverage ids. */
    scope: string;

    /** Delivered width/height ratio; undefined uses the camera compiler's square fit, as do non-positive/non-finite values at that lower layer. */
    aspect: number | undefined;

    /** Portable staged model catalogue. Undefined behaves as an empty catalogue: framing may use rig/default bounds, while envelope clearance refuses unmeasurable staged obstacles. */
    models: readonly IAutoMovieModel[] | undefined;

    /** Compact formation cues on the shot clock, used when measuring and following group subjects; empty keeps groups at their opening placement. */
    formationMotions: readonly IAutoMovieFormationMotion[];

    /** Final actor motions by node id, read without mutation after coupling; absent entries contribute no actor motion. */
    motions: Record<string, IAutoMovieMotion>;

    /** Final object clips in producer/channel-authority order, sampled on the shot clock for framing and clearance. */
    objectMotions: readonly IAutoMovieClip[];

    /** Staged node world-facing quaternions, used to place actor root movement; a missing facing prevents the actor-motion following branch. */
    rotations: ReadonlyMap<string, IAutoMovieQuaternion>;

    /** Builder-owned geometry revision and clearance clock; required only when a selected camera declares an envelope. */
    runtime: IAutoMovieCameraClearanceRuntime | undefined;
  };
}
