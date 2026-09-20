import { IAutoMovieClip } from "@automovie/interface";
import { channelKey } from "./channelKey";
import { IAutoMovieSampledChannel } from "./IAutoMovieSampledChannel";
import { sampleClip } from "./sampleClip";

/**
 * Sample a sequence of clips under shot-time channel authority.
 *
 * Authority is selected independently for every channel: among tracks whose
 * first key has started by `seconds`, the track with the latest first key wins;
 * equal starts go to the later clip in producer order. A future track writes
 * nothing, instead of letting {@link sampleClip}'s before-first-key clamp
 * overwrite the authority that is currently in effect.
 *
 * @evidence requirements/motion/layers-blends-and-transitions.md#motion-layer-channel-ownership Selects one explicit time-qualified owner for every channel across the clip sequence.
 * @evidence specifications/performance-motion-and-staging/motion-sampling-and-composition.md#performance-motion-layer-mask-transition-composition Implements channel authority across ordered temporal layers without future-key leakage.
 * @author Samchon
 */
export const sampleClipSequence = (
  clips: readonly IAutoMovieClip[],
  seconds: number,
): Map<string, IAutoMovieSampledChannel> => {
  if (!Number.isFinite(seconds))
    throw new Error(
      `sampleClipSequence seconds must be finite, but was ${seconds}`,
    );
  const sampledByClip = new Map(
    clips.map((clip) => [clip, sampleClip(clip, seconds)] as const),
  );
  const authority = new Map<string, { start: number; clip: IAutoMovieClip }>();
  for (const clip of clips)
    for (const track of clip.tracks) {
      const start = track.times[0]!;
      if (start > seconds) continue;
      const key = channelKey(track.channel);
      const previous = authority.get(key);
      if (previous === undefined || start >= previous.start)
        authority.set(key, { start, clip });
    }

  const out = new Map<string, IAutoMovieSampledChannel>();
  for (const [key, entry] of authority) {
    out.set(key, sampledByClip.get(entry.clip)!.get(key)!);
  }
  return out;
};
