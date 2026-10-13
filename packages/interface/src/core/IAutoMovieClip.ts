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
 * @evidence contracts/common.md#principled-implementation Mirrors a glTF animation as parallel time and value tracks; `sampleClip` normalizes the query time once per clip, clamping or taking a non-negative modulo when `loop` is set, and samples every track at that time, so all channels of the clip share one clock.
 * @evidence contracts/common.md#clear-and-simple-design Holds only identity, duration, loop and tracks; the semantic `IAutoMovieMotion` stays a separate type because pose keyframes and flat channel tracks serve different authors, with `motionToClip` as the one bridge.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No channel kind is special-cased by the clip itself; the sampler throws on a repeated channel key instead of letting the later track overwrite the earlier one.
 * @evidence contracts/common.md#meaningful-documentation Explains the clip-versus-motion split, how query time is clamped or wrapped, the duration rules of the sampler and the artifact gate, and the one-track-per-channel rule.
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
