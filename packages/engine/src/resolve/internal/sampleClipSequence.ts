import {
  IAutoMovieClip,
  type IAutoMovieSampledChannel,
} from "@automovie/interface";

import { channelKey } from "./channelKey";
import { sampleClip } from "./sampleClip";

/*
 * Select each channel's latest first key that has started at finite shot
 * seconds, breaking equal starts by later clip order. All clips are
 * sampled/validated, but future tracks acquire no authority. Winning sampled
 * records are returned in a fresh map.
 */
export function sampleClipSequence(
  clips: readonly IAutoMovieClip[],
  seconds: number,
): Map<string, IAutoMovieSampledChannel> {
  const sampledByClip: Map<
    IAutoMovieClip,
    Map<string, IAutoMovieSampledChannel>
  > = new Map(
    clips.map(
      (
        clip: IAutoMovieClip,
      ): readonly [IAutoMovieClip, Map<string, IAutoMovieSampledChannel>] =>
        [clip, sampleClip(clip, seconds)] as const,
    ),
  );
  const authority: Map<string, { start: number; clip: IAutoMovieClip }> =
    new Map<string, { start: number; clip: IAutoMovieClip }>();
  for (const clip of clips)
    for (const track of clip.tracks) {
      const start: number = track.times[0]!;
      if (start > seconds) continue;
      const key: string = channelKey(track.channel);
      const previous: { start: number; clip: IAutoMovieClip } | undefined =
        authority.get(key);
      if (previous === undefined || start >= previous.start)
        authority.set(key, { start, clip });
    }

  const out: Map<string, IAutoMovieSampledChannel> = new Map<
    string,
    IAutoMovieSampledChannel
  >();
  for (const [key, entry] of authority) {
    out.set(key, sampledByClip.get(entry.clip)!.get(key)!);
  }
  return out;
}
