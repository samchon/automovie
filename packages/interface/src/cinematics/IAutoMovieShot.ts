import { IAutoMovieClip } from "../core/IAutoMovieClip";
import { IAutoMovieCameraClearanceReport } from "../scene/IAutoMovieCameraClearanceReport";
import { IAutoMovieCameraIntent } from "./IAutoMovieCameraIntent";
import { IAutoMovieInteractionEvent } from "./IAutoMovieInteractionEvent";
import { IAutoMovieShotCoverage } from "./IAutoMovieShotCoverage";
import { IAutoMovieShotPerformance } from "./IAutoMovieShotPerformance";

/**
 * A shot: one continuous take (a scene, the camera that frames it, the camera's
 * move, and what every placed node performs) over a local time range. This is
 * the unit an LLM renders ("render this shot") and the rung above a single clip
 * on the road to assembling a film from objects and motion.
 *
 * Time is local to the shot (origin 0, seconds); a {@link IAutoMovieSequence}
 * composes shots into a global timeline. The camera is a scene node, so its
 * move is an ordinary {@link IAutoMovieClip} of transform (and FOV) tracks: no
 * special camera-animation concept.
 *
 * @author Samchon
 */
export interface IAutoMovieShot {
  /** Stable id. */
  id: string;

  /** Human / LLM readable name. Null if unnamed. */
  name: string | null;

  /** Id of the scene (placed models, lights, cameras) this shot renders. */
  scene: string;

  /** Id of the scene camera that is live for this shot. */
  camera: string;

  /**
   * The camera's move for this shot: a clip of the camera node's transform (and
   * FOV) tracks. `null` for a locked-off (static) camera.
   */
  cameraMotion: IAutoMovieClip | null;

  /** Per scene-node performances for this shot. */
  performances: IAutoMovieShotPerformance[];

  /**
   * Node-transform clips for **non-skeletal scene objects** the shot animates
   * (a launched projectile's baked flight, a prop carried along a path), each
   * an ordinary {@link IAutoMovieClip} keyed to its object's scene node.
   * Distinct from `performances` (skeletal pose motions played through a rig)
   * and from `cameraMotion` (the one live camera): a projectile has no
   * skeleton, so it moves the same way the camera does: a clip of transform
   * tracks. Empty when the shot animates no such object.
   */
  objectMotions: IAutoMovieClip[];

  /**
   * Clips changing this shot's LIGHTING over its local clock: a candle going
   * out, a sunset. Each track addresses one staged light by pointer channel
   * (`/lights/<id>/intensity`); the PERFORMANCE guide states the grammar.
   * Absent means legacy; an empty array means constant light.
   */
  lightMotions?: IAutoMovieClip[];

  /**
   * Computed or scripted interactions on this shot's local clock. `performShot`
   * emits this for contacts, hits, falls, and attach handoffs so downstream
   * tools can follow the same timing the engine used. Absent means legacy or
   * no-event data; an empty array means the shot was assembled and had none.
   */
  events?: IAutoMovieInteractionEvent[];

  /**
   * The camera's directorial intent per frame span (#1187): framing, move, the
   * resolved focus point, and the lens intent. Structural guide metadata a
   * diffusion/render host reads beside `cameraMotion`, exactly as it reads
   * `events`. The deterministic camera solve never consumes it. Absent means
   * legacy; an empty array means the shot was assembled with no frame actions.
   */
  cameraIntent?: IAutoMovieCameraIntent[];

  /**
   * The alternate camera takes covering the same beat (#1187): one staged
   * camera per additional angle, each with its own compiled move and intent.
   * The hero take stays the singular `camera`/`cameraMotion` every consumer
   * already reads; coverage rides beside it as structural guide metadata a
   * diffusion/render host uses to render the beat from the other staged angles,
   * exactly as it reads `cameraIntent`. The cut is untouched: coverage takes
   * are alternates of THIS shot, never separate timeline entries. Absent means
   * legacy or single-camera data; an empty array means the shot was assembled
   * with one camera.
   */
  coverage?: IAutoMovieShotCoverage[];

  /**
   * Current-revision swept-clearance reports for the hero and alternate takes
   * whose staged cameras declared physical envelopes.
   *
   * Omitted preserves legacy shots whose cameras make no clearance claim. A
   * present list contains only clear reports: blocked or stale evaluation is a
   * performance refusal and no shot artifact is published.
   */
  cameraClearance?: IAutoMovieCameraClearanceReport[];

  /** Shot length in seconds (local time origin = 0). */
  duration: number;
}
