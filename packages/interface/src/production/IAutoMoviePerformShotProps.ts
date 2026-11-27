import type { IAutoMovieBlocking } from "../authoring/IAutoMovieBlocking";
import type { IAutoMoviePerformance } from "../authoring/IAutoMoviePerformance";
import type { IAutoMovieCameraClearanceRuntime } from "../cinematics/IAutoMovieCameraClearanceRuntime";
import type { IAutoMovieFlameCue } from "../cinematics/IAutoMovieFlameCue";
import type { IAutoMoviePolygonBodyCue } from "../cinematics/IAutoMoviePolygonBodyCue";
import type { IAutoMoviePracticalSurfaceTrack } from "../cinematics/IAutoMoviePracticalSurfaceTrack";
import type { IAutoMovieSurfaceGraphicTrack } from "../cinematics/IAutoMovieSurfaceGraphicTrack";
import type { IAutoMovieClip } from "../core/IAutoMovieClip";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieActionTarget } from "../harness/IAutoMovieActionTarget";
import type { IAutoMovieBeatEndState } from "../harness/IAutoMovieBeatEndState";
import type { IAutoMoviePropSpec } from "../harness/IAutoMoviePropSpec";
import type { IAutoMovieScript } from "../harness/IAutoMovieScript";
import type { IAutoMovieModel } from "../model/IAutoMovieModel";
import type { IAutoMovieActionSynthesizer } from "../motion/IAutoMovieActionSynthesizer";
import type { IAutoMovieRestFrame } from "../pose/IAutoMovieRestFrame";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieJointAxes } from "../skeleton/IAutoMovieJointAxes";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieFontSource } from "../typography/IAutoMovieFontSource";
import type { IAutoMovieCompiledFormation } from "./IAutoMovieCompiledFormation";
import type { IAutoMovieFormationMotion } from "./IAutoMovieFormationMotion";
import type { IAutoMoviePracticalLightBinding } from "./IAutoMoviePracticalLightBinding";
import type { IAutoMovieProductionFrameRate } from "./IAutoMovieProductionFrameRate";
import type { IAutoMovieStagedSet } from "./IAutoMovieStagedSet";

/**
 * The inputs of {@link performShot}: the script, the staged world and the beat's
 * performance, the synthesizer and rig lookups that realize it, and the
 * optional context that sharpens framing, gating and coupling.
 *
 * Every optional field states what omitting it does; none changes the shot of a
 * caller that omits it beyond what that field documents.
 */
export interface IAutoMoviePerformShotProps {
  /** The script whose beats the performance may realize. */
  script: IAutoMovieScript;

  /** The validated stage result, the one coordinate authority for the shot. */
  staged: IAutoMovieStagedSet.ISuccess;

  /** The beat's performance: beat id, duration, draft and revise pass. */
  performance: IAutoMoviePerformance;

  /**
   * Synchronous action/actor synthesizer. performShot memoizes each action
   * object and actor pair, including null, and passes previous through; null
   * contributes no motion. Exceptions propagate and input actions must remain
   * stable.
   */
  synthesize: IAutoMovieActionSynthesizer;

  /**
   * Rig lookup by node id; null for a node with no skeleton, whose clip skips
   * the range-of-motion gate and whose subject is measured without a rig span.
   */
  skeleton: (node: string) => IAutoMovieSkeleton | null;

  /**
   * Compiler-owned models for the staged nodes, used to measure what a camera
   * frames. A rig's joint span is not the figure's height, so framing from the
   * rig alone crops a head; omitted, the rig span is the fallback.
   */
  models?: readonly IAutoMovieModel[];

  /**
   * Compiler-owned geometry revision and inspection clock. Required once a
   * take's camera declares a physical envelope; a camera without one is
   * unaffected when it is omitted.
   */
  cameraClearance?: IAutoMovieCameraClearanceRuntime;

  /**
   * Compiled compact formations present in this shot, so a camera can frame a
   * mass. A group naming a formation this list lacks is a violation.
   */
  formations?: readonly IAutoMovieCompiledFormation[];

  /**
   * The shot's compact formation cues, so a framed unit is measured where its
   * cue has put it; omitted, every formation is framed at rest.
   */
  formationMotions?: readonly IAutoMovieFormationMotion[];

  /**
   * Delivery raster and clock. The raster sets the horizontal half of the
   * framing fit: omitted, or with a non-positive side, a wide subject is fitted
   * to a square frame, which stands back far enough for any raster of that
   * height. The clock sets the frames moving camera paths are keyed at:
   * omitted, the camera compiler keys at 24 frames per second.
   */
  frameFormat?: {
    /**
     * Delivery width in pixels used only through width/height. A side that is
     * not greater than zero selects the square-frame fallback; finite positive
     * dimensions are the caller's premise.
     */
    width: number;
    /**
     * Delivery height in pixels used as the aspect-ratio denominator; the same
     * non-positive-side fallback applies.
     */
    height: number;

    /**
     * Delivery frames per second. Omitted, the camera compiler's 24 fps
     * fallback applies. Without `frameRate` it must be a positive safe integer;
     * with it, it must equal that rate's quotient. A violation of either is
     * reported at `$input.frameFormat.fps`.
     */
    fps?: number;

    /** Exact delivery frame rate when `fps` is fractional; read only with `fps`. */
    frameRate?: IAutoMovieProductionFrameRate;
  };

  /**
   * Actor-registry membership; omitted, a bone target's actor is not checked
   * against a registry.
   */
  hasActorContext?: (node: string) => boolean;

  /**
   * Per-node joint axes the renderer uses, so ground planting and attachment
   * baking read the rig through one basis. Omitted, both use their defaults.
   */
  jointAxes?: (
    node: string,
  ) => Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> | undefined;

  /**
   * Per-node rest frames the renderer uses, so planting and `attachTo` clips
   * read the visible pose rather than raw rig-space forward kinematics.
   */
  restFrames?: (
    node: string,
  ) => Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>> | undefined;

  /**
   * Live resolver for targets whose point changes during the shot; its `null`
   * falls back to the staged placement. Positions are world metres at
   * shot-local seconds.
   */
  targetAt?: (
    target: IAutoMovieActionTarget,
    seconds: number,
  ) => IAutoMovieVector3 | null;

  /**
   * The gait names each actor supplies; a `locomote` naming another gait is a
   * violation. Omitted, or `undefined` for a node, skips the check.
   */
  gaits?: (node: string) => readonly string[] | undefined;

  /**
   * The beat's validated blocking. Supplying it arms the coherence gate and the
   * coverage takes.
   */
  blocking?: IAutoMovieBlocking;

  /**
   * Clips moving the staged lights over this shot's clock, carried onto
   * `shot.lightMotions` after each track is checked to address a staged light.
   * Omitted, the shot carries no such field.
   */
  lightMotions?: readonly IAutoMovieClip[];

  /**
   * Practical lights bound to staged prop emitters. Compiled from the final
   * object clips, using the corresponding prop model in models, and appended to
   * lightMotions. Omit when no practical source follows a prop.
   */
  practicalLights?: readonly IAutoMoviePracticalLightBinding[];

  /**
   * Shot-local material changes on placed prop parts. Nonempty input requires
   * the corresponding generated rigid models in models. Omit for the staged
   * appearance alone.
   */
  practicalSurfaces?: readonly IAutoMoviePracticalSurfaceTrack[];

  /**
   * Pictures on `surface` affordances of placed props. Nonempty input requires
   * the corresponding generated rigid models in models. Omit for no surface
   * graphic.
   */
  surfaceGraphics?: readonly IAutoMovieSurfaceGraphicTrack[];

  /**
   * Flames at placed props' flame frames. Nonempty input requires the props'
   * models in models; a cue naming a practical light binding flickers that
   * binding's intensity track. Omit for no flame.
   */
  flames?: readonly IAutoMovieFlameCue[];

  /**
   * Font sources that text layers explicitly name, admitted from their records
   * and carried onto `shot.fonts`. Layers without a font id use the browser's
   * system UI font and require no source here.
   */
  fonts?: readonly IAutoMovieFontSource[];

  /**
   * Polygon body changes keyed by staged node and rig bone, timed in
   * source-shot seconds.
   */
  polygonBodyCues?: readonly IAutoMoviePolygonBodyCue[];

  /**
   * Clips the source authored over non-performing scene nodes, such as a door's
   * panel or a prop's hinge, carried onto `shot.objectMotions` after the baked
   * ones once {@link gateAuthoredObjectMotions} admits them.
   */
  objectMotions?: readonly IAutoMovieClip[];

  /**
   * The shot's prop registry, whose articulation lowers the joints an authored
   * object clip may drive and bounds their travel.
   */
  props?: readonly IAutoMoviePropSpec[];

  /**
   * Registered source identity for direct code authoring; omitted, the shot id
   * is `shot:<beat>`.
   */
  shotId?: string;

  /**
   * Prior verified beat state, passed to every synthesizer call. The caller
   * restages `staged` from it beforehand, as `compileDefinedShot` does.
   */
  previous?: IAutoMovieBeatEndState | null;
}
