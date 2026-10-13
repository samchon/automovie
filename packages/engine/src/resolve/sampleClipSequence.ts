import { IAutoMovieClip } from "@automovie/interface";

import { IAutoMovieSampledChannel } from "./IAutoMovieSampledChannel";
import { channelKey } from "./channelKey";
import { sampleClip } from "./sampleClip";

/**
 * Select each channel's latest first key that has started at finite shot seconds, breaking equal starts by later clip order. All clips are sampled/validated, but future tracks acquire no authority. Winning sampled records are returned in a fresh map.
 *
 * @evidence contracts/common.md#principled-implementation Validate/sample all clips and choose each channel's latest started first key, with later producer order breaking ties and future tracks withholding authority.
 * @evidence contracts/common.md#clear-and-simple-design sampleClip owns interpolation while this shared frame/baked-placement/query seam owns cross-clip authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Future clips remain validated rather than skipped; clip looping and raw sequence start authority are distinct existing rules.
 * @evidence contracts/common.md#meaningful-documentation Docs state finite seconds, per-channel started-key choice and ties rather than whole-clip last-wins.
 * @evidence contracts/performance.md#efficient-algorithms All clip key payloads are validated/sampled before track scans; storage includes every clip map plus channel authority and output maps.
 * @evidence contracts/performance.md#reuse-equivalent-work Completed clip samples serve all winning channels; repeated object occurrences are currently resampled before object-key deduplication, a reuse limitation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Winning records escape in a new map; losing samples/authority release with the call and no persistent clip cache, handle or task is held.
 */
export const sampleClipSequence: (clips: readonly IAutoMovieClip[], seconds: number) => Map<string, IAutoMovieSampledChannel> = (
  clips: readonly IAutoMovieClip[],
  seconds: number,
): Map<string, IAutoMovieSampledChannel> => {
  if (!Number.isFinite(seconds))
    throw new Error(
      `sampleClipSequence seconds must be finite, but was ${seconds}`,
    );
  const sampledByClip: Map<IAutoMovieClip, Map<string, IAutoMovieSampledChannel>> = new Map(
    clips.map((clip: IAutoMovieClip) : readonly [IAutoMovieClip, Map<string, IAutoMovieSampledChannel>] => [clip, sampleClip(clip, seconds)] as const),
  );
  const authority: Map<string, { start: number; clip: IAutoMovieClip; }> = new Map<string, { start: number; clip: IAutoMovieClip }>();
  for (const clip of clips)
    for (const track of clip.tracks) {
      const start: number = track.times[0]!;
      if (start > seconds) continue;
      const key: string = channelKey(track.channel);
      const previous: { start: number; clip: IAutoMovieClip; } | undefined = authority.get(key);
      if (previous === undefined || start >= previous.start)
        authority.set(key, { start, clip });
    }

  const out: Map<string, IAutoMovieSampledChannel> = new Map<string, IAutoMovieSampledChannel>();
  for (const [key, entry] of authority) {
    out.set(key, sampledByClip.get(entry.clip)!.get(key)!);
  }
  return out;
};
