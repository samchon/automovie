import type { IAutoMovieTrack } from "./IAutoMovieTrack";

/**
 * A named bundle of flat-accessor tracks sharing one local-seconds timeline.
 * Tracks may address node transforms, morph weights or pointer properties;
 * stock shot-field gates restrict cameraMotion and objectMotions to node
 * channels and lightMotions to supported light pointers.
 *
 * IAutoMovieMotion stores semantic pose keyframes referenced by shot
 * performances; Clip stores the flat tracks carried by camera, object and light
 * motion fields. motionToClip lowers clinical articulation into bone-rotation
 * tracks and authored root TRS tracks, so the two representations can coexist
 * in one shot.
 *
 * SampleClip reads tracks at one finite query time, clamping to [0, duration]
 * or wrapping a positive duration when loop is set. Duration zero samples at
 * time zero. Duplicate canonical channel keys throw even when their record
 * spellings differ.
 */
export interface IAutoMovieClip {
  /** Stable id. */
  id: string;

  /** Human or LLM readable name, or `null` when unnamed. */
  name: string | null;

  /**
   * Total seconds: finite and nonnegative for sampleClip, strictly positive for
   * committed artifacts. Positive duration bounds key times; the low-level
   * zero-duration case skips their upper bound and samples at time zero.
   */
  duration: number;

  /** Whether a query time wraps modulo `duration` instead of clamping to it. */
  loop: boolean;

  /** The tracks; each targets one channel, and no two share a channel. */
  tracks: IAutoMovieTrack[];
}
