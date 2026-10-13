import { IAutoMovieTrack } from "./IAutoMovieTrack";

/**
 * A clip: a named bundle of flat-accessor tracks sharing one local-seconds
 * timeline. The general track form: its tracks may drive a character's bones, a
 * camera's transform and FOV, a prop's hinge, and a face's morph weights all at
 * once.
 *
 * Clip **coexists with** {@link IAutoMovieMotion}, it does not replace it: they
 * are two live forms for two jobs. Motion is the semantic keyframe-pose vehicle
 * an actor performs (`perform` produces it, `validateMotion` checks it, and
 * `IAutoMovieShot.performances` reference it by id); Clip is the general
 * flat-array track form the same shot carries for its `cameraMotion` and
 * `objectMotions` (a projectile or a prop has no skeleton, so it moves by
 * transform tracks, not a pose motion). A humanoid Motion lowers onto a Clip
 * through `motionToClip`: a clip whose tracks target bone-rotation channels
 * under the humanoid profile's retarget discipline (rotation-only except the
 * root), so one shot legitimately holds both representations at once.
 *
 * `sampleClip` reads every track at one query time, clamped to `[0, duration]`
 * or wrapped modulo `duration` when `loop` is set. Two tracks on the same
 * channel within one clip throw.
 *
 * @author Samchon
 */
export interface IAutoMovieClip {
  /** Stable id. */
  id: string;

  /** Human / LLM readable name. Null if unnamed. */
  name: string | null;

  /**
   * Total length in seconds. The sampler requires a finite, non-negative value
   * and throws on any key time past it; the clip artifact gate further requires
   * it to be positive.
   */
  duration: number;

  /** Whether a query time wraps modulo `duration` instead of clamping to it. */
  loop: boolean;

  /** The tracks; each targets one channel, and no two share a channel. */
  tracks: IAutoMovieTrack[];
}
