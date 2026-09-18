import { IAutoMovieClip } from "@automovie/interface";
import { channelKey } from "./channelKey";
import { IAutoMovieSampledChannel } from "./IAutoMovieSampledChannel";

/**
 * The SAMPLE pass: evaluate every track of a clip at time `seconds`, returning
 * the sampled value of each channel keyed by {@link channelKey}.
 *
 * This is the engine's bridge from the sparse keyframes an LLM (or an imported
 * glTF) emits to the dense per-frame channel values the rest of the pipeline
 * (constrain → compose) consumes, the universal generalization of the
 * humanoid-only {@link sampleMotion}: a track may drive a node's TRS, morph
 * weights, a camera FOV, or any pointer-addressed property, and they all sample
 * identically.
 *
 * Time is normalized to the clip: clamped to `[0, duration]`, or wrapped modulo
 * `duration` when the clip `loop`s. A track with a single keyframe (or sampled
 * before its first / after its last key) yields that key's value verbatim.
 *
 * @evidence requirements/motion/clips-keyframes-and-interpolation.md#motion-interpolation Evaluates each track with its declared interpolation mode.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-clip-keytime-interpolation Samples sparse keys deterministically at the normalized clip time.
 * @author Samchon
 */
export const sampleClip = (
  clip: IAutoMovieClip,
  seconds: number,
): Map<string, IAutoMovieSampledChannel> => {
  validateSampleTime(seconds, clip.duration, clip.loop);
  const time = normalizeTime(seconds, clip.duration, clip.loop);
  const out = new Map<string, IAutoMovieSampledChannel>();
  for (const track of clip.tracks) {
    const key = channelKey(track.channel);
    if (out.has(key)) throw new Error(`duplicate track channel "${key}"`);
    out.set(key, {
      channel: track.channel,
      value: sampleTrack(track, time, clip.duration),
    });
  }
  return out;
};
