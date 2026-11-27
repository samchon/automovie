import { type IAutoMovieSampledChannel, type IAutoMovieClip } from "@automovie/interface";
import { sampleClip as sampleClipImplementation } from "./internal/sampleClip";
import { sampleClipSequence as sampleClipSequenceImplementation } from "./internal/sampleClipSequence";

/** Public operations for Auto Movie Engine Sequence. */
export namespace AutoMovieEngineSequence {
  /**
   * Sample every admitted track at finite clip-local seconds, clamped or
   * duration-wrapped. STEP changes at exact keys, LINEAR uses quaternion slerp
   * where declared, and cubic Hermite scales tangents by segment duration and
   * normalizes interpolated rotations. Before/after-key endpoints copy authored
   * values verbatim.
   */
  export function sampleClip(clip: IAutoMovieClip, seconds: number): Map<string, IAutoMovieSampledChannel> {
    return sampleClipImplementation(clip, seconds);
  }

  /**
   * Select each channel's latest first key that has started at finite shot
   * seconds, breaking equal starts by later clip order. All clips are
   * sampled/validated, but future tracks acquire no authority. Winning sampled
   * records are returned in a fresh map.
   */
  export function sampleClipSequence(clips: readonly IAutoMovieClip[], seconds: number): Map<string, IAutoMovieSampledChannel> {
    return sampleClipSequenceImplementation(clips, seconds);
  }
}
