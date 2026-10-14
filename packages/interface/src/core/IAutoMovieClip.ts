import { IAutoMovieTrack } from "./IAutoMovieTrack";

/**
 * A named bundle of flat-accessor tracks sharing one local-seconds timeline. Tracks may address node transforms, morph weights or pointer properties; stock shot-field gates restrict cameraMotion and objectMotions to node channels and lightMotions to supported light pointers.
 *
 * IAutoMovieMotion stores semantic pose keyframes referenced by shot performances; Clip stores the flat tracks carried by camera, object and light motion fields. motionToClip lowers clinical articulation into bone-rotation tracks and authored root TRS tracks, so the two representations can coexist in one shot.
 *
 * sampleClip reads tracks at one finite query time, clamping to [0, duration] or wrapping a positive duration when loop is set. Duration zero samples at time zero. Duplicate canonical channel keys throw even when their record spellings differ.
 *
 * @evidence contracts/common.md#principled-implementation Mirrors a glTF animation as parallel accessor tracks on one clock; `sampleClip` validates the duration and `loop` through the shared `clipDurationFault` and `clipLoopFault`, normalizes the query time by clamp or positive modulo, and samples each track through `clipTrackShapeFaults` and its interpolation mode.
 * @evidence contracts/common.md#clear-and-simple-design A clip is only an id, a name, a clock and a track list; what a track may address is decided by the shot field that carries it, not by a clip subtype per use.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The sampler refuses duplicate canonical channelKey addresses. Artifact admission additionally requires positive duration, but its JSON-serialized channel duplicate key can miss equivalent addresses with different property ordering or pointer value-type declarations; artifact success alone therefore does not certify sampler acceptance.
 * @evidence contracts/common.md#meaningful-documentation States what a clip may drive and which shot fields restrict it, how it relates to Motion and `motionToClip`, the sampling clock and loop rule, the duplicate-channel throw, and the two duration rules.
 * @author Samchon
 */
export interface IAutoMovieClip {
  /** Stable id. */
  id: string;

  /** Human or LLM readable name, or `null` when unnamed. */
  name: string | null;

  /**
   * Total seconds: finite and nonnegative for sampleClip, strictly positive for committed artifacts. Positive duration bounds key times; the low-level zero-duration case skips their upper bound and samples at time zero.
   */
  duration: number;

  /** Whether a query time wraps modulo `duration` instead of clamping to it. */
  loop: boolean;

  /** The tracks; each targets one channel, and no two share a channel. */
  tracks: IAutoMovieTrack[];
}
