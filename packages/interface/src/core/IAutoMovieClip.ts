import { IAutoMovieTrack } from "./IAutoMovieTrack";

/**
 * A clip: a named bundle of flat-accessor tracks sharing one local-seconds
 * timeline. The general track form: its tracks may drive a character's bones,
 * a camera's transform, a prop's hinge, a face's morph weights, or a
 * pointer-addressed property, all at once. Each shot field that carries clips
 * admits only the channels its applier writes, so a clip stored on
 * `cameraMotion` or `objectMotions` holds node channels only.
 *
 * Clip coexists with {@link IAutoMovieMotion} rather than replacing it: they
 * are two live forms for two jobs. Motion is the semantic keyframe-pose vehicle
 * an actor performs (`perform` produces it, `validateMotion` checks it, and
 * `IAutoMovieShot.performances` reference it by id); Clip is the general
 * flat-array track form the same shot carries for its `cameraMotion`,
 * `objectMotions` and `lightMotions` (a projectile or a prop has no skeleton,
 * so it moves by transform tracks, not a pose motion). A humanoid Motion
 * lowers onto a Clip through `motionToClip`: a clip whose tracks target
 * bone-rotation channels under the humanoid profile's retarget discipline
 * (rotation-only except the root), so one shot legitimately holds both
 * representations at once.
 *
 * `sampleClip` reads every track at one finite query time, clamped to `[0,
 * duration]` or wrapped modulo `duration` when `loop` is set. Two tracks on the
 * same channel within one clip throw.
 *
 * @evidence contracts/common.md#principled-implementation Mirrors a glTF animation as parallel accessor tracks on one clock; `sampleClip` validates the duration and `loop` through the shared `clipDurationFault` and `clipLoopFault`, normalizes the query time by clamp or positive modulo, and samples each track through `clipTrackShapeFaults` and its interpolation mode.
 * @evidence contracts/common.md#clear-and-simple-design A clip is only an id, a name, a clock and a track list; what a track may address is decided by the shot field that carries it, not by a clip subtype per use.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A duplicate channel throws rather than letting the later track win, and the artifact gate is stricter than the sampler (positive duration) so it refuses more than the sampler would throw on, never less.
 * @evidence contracts/common.md#meaningful-documentation States what a clip may drive and which shot fields restrict it, how it relates to Motion and `motionToClip`, the sampling clock and loop rule, the duplicate-channel throw, and the two duration rules.
 * @author Samchon
 */
export interface IAutoMovieClip {
  /** Stable id. */
  id: string;

  /** Human or LLM readable name, or `null` when unnamed. */
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
