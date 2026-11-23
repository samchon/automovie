import type { IAutoMovieClip } from "../core/IAutoMovieClip";
import type { IAutoMovieCameraClearanceReport } from "../scene/IAutoMovieCameraClearanceReport";
import type { IAutoMovieFontSource } from "../typography/IAutoMovieFontSource";
import type { IAutoMovieCameraIntent } from "./IAutoMovieCameraIntent";
import type { IAutoMovieEditorialMarker } from "./IAutoMovieEditorialMarker";
import type { IAutoMovieFlameCue } from "./IAutoMovieFlameCue";
import type { IAutoMovieInteractionEvent } from "./IAutoMovieInteractionEvent";
import type { IAutoMoviePolygonBodyCue } from "./IAutoMoviePolygonBodyCue";
import type { IAutoMoviePracticalSurfaceTrack } from "./IAutoMoviePracticalSurfaceTrack";
import type { IAutoMovieShotCoverage } from "./IAutoMovieShotCoverage";
import type { IAutoMovieShotPerformance } from "./IAutoMovieShotPerformance";
import type { IAutoMovieSurfaceGraphicTrack } from "./IAutoMovieSurfaceGraphicTrack";

/**
 * A shot: one continuous take (a scene, the camera that frames it, the camera's
 * move, and what every placed node performs) over a local time range. This is
 * the unit an LLM renders ("render this shot") and the rung above a single clip
 * on the road to assembling a film from objects and motion.
 *
 * Time is local to the shot (origin 0, seconds); a {@link IAutoMovieSequence}
 * composes shots into a global timeline. The camera is a scene node, so its
 * move is an ordinary {@link IAutoMovieClip} of node transform tracks, with no
 * special camera-animation concept.
 *
 * `performShot` assembles the shot and `validateShotArtifact` is its structural
 * contract, which every producer and consumer shares. A clip field admits only
 * the channels its own applier writes: `cameraMotion` and `objectMotions` take
 * node channels, and `lightMotions` takes light pointers, so a pointer such as
 * a camera's field of view is refused rather than stored and ignored.
 */
export interface IAutoMovieShot {
  /** Stable, non-blank id. */
  id: string;

  /** Human or LLM readable name, or `null` when unnamed. */
  name: string | null;

  /** Id of the scene (placed models, lights, cameras) this shot renders. */
  scene: string;

  /** Id of the scene camera that is live for this shot. */
  camera: string;

  /**
   * The camera's move for this shot: a clip of the camera node's transform
   * tracks. `null` for a locked-off (static) camera.
   */
  cameraMotion: IAutoMovieClip | null;

  /** Per scene-node performances for this shot, at most one per node. */
  performances: IAutoMovieShotPerformance[];

  /**
   * Node-transform clips for non-skeletal scene objects the shot animates (a
   * launched projectile's baked flight, a prop carried along a path, a door
   * panel or prop joint the source authored), each an ordinary
   * {@link IAutoMovieClip} with a unique id. Distinct from `performances`
   * (skeletal pose motions played through a rig) and from `cameraMotion` (the
   * one live camera): an object has no skeleton, so it moves the way the camera
   * does, by a clip of transform tracks. Empty when the shot animates no such
   * object.
   */
  objectMotions: IAutoMovieClip[];

  /**
   * Clips changing this shot's lighting over its local clock: a candle going
   * out, a sunset. Each track addresses one staged light by the pointer
   * `/lights/<id>/<property>`, where the property is `intensity`, `color`,
   * `range`, `coneAngle`, `position` or `rotation`, and no two tracks across
   * the list may address the same light property. Absent means legacy; an empty
   * array means constant light.
   */
  lightMotions?: IAutoMovieClip[];

  /**
   * Material tracks for named parts of placed props. At most one per node and
   * part. Omission or an empty list leaves the staged appearance in force.
   */
  practicalSurfaces?: readonly IAutoMoviePracticalSurfaceTrack[];

  /**
   * Pictures shown on `surface` affordances of placed props. At most one per
   * node and surface. Omission or an empty list shows no surface graphic.
   */
  surfaceGraphics?: readonly IAutoMovieSurfaceGraphicTrack[];

  /**
   * Flames burning at placed props' flame frames, unique by id. A flame bound
   * to a practical light flickers that light's intensity track in
   * `lightMotions`. Omission or an empty list draws no flame.
   */
  flames?: readonly IAutoMovieFlameCue[];

  /**
   * Font sources the surface graphics' text layers name, unique by id. `render`
   * decodes every listed source before it draws a frame of the shot and refuses
   * the shot when one fails. Omitted when no layer letters text.
   */
  fonts?: readonly IAutoMovieFontSource[];

  /**
   * Polygon body changes in source-shot time. Each subject and bone pair may
   * appear once.
   */
  polygonBodyCues?: readonly IAutoMoviePolygonBodyCue[];

  /**
   * Computed or scripted interactions on this shot's local clock, ordered by
   * time, then kind, then id. `performShot` emits this for contacts, hits,
   * falls, and attach handoffs so downstream tools can follow the same timing
   * the engine used. Absent means legacy or no-event data; an empty array means
   * the shot was assembled and had none.
   */
  events?: IAutoMovieInteractionEvent[];

  /**
   * Authored shot-local annotations in authored order. Omit when no marker list
   * was supplied.
   */
  editorialMarkers?: readonly IAutoMovieEditorialMarker[];

  /**
   * The camera's directorial intent per frame span: framing, move, the resolved
   * focus point, and the lens intent. Structural guide metadata a diffusion or
   * render host reads beside `cameraMotion`, as it reads `events`. The
   * deterministic camera solve never consumes it. Absent means legacy; an empty
   * array means the shot was assembled with no frame actions.
   */
  cameraIntent?: IAutoMovieCameraIntent[];

  /**
   * The alternate camera takes covering the same beat: one staged camera per
   * additional angle, each with its own compiled move and intent. The hero take
   * stays the singular `camera` and `cameraMotion` every consumer already
   * reads; coverage rides beside it as structural guide metadata a diffusion or
   * render host uses to render the beat from the other staged angles. The cut
   * is untouched: coverage takes are alternates of this shot, never separate
   * timeline entries. Absent means legacy or single-camera data; an empty array
   * means the shot was assembled with one camera.
   */
  coverage?: IAutoMovieShotCoverage[];

  /**
   * Swept-clearance reports for hero and alternate takes declaring physical
   * envelopes, one per such camera. The performing producer checks the runtime
   * revision; the stored report has no revision pair for an artifact reader to
   * re-establish freshness independently.
   *
   * Omission is admitted only when no delivered camera declares an envelope. A
   * present list must carry clear reports with empty findings; blocked or stale
   * evaluation refuses publication by the performing producer.
   */
  cameraClearance?: IAutoMovieCameraClearanceReport[];

  /** Finite positive shot length in seconds (local time origin = 0). */
  duration: number;
}
