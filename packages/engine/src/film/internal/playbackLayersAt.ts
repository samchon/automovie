import type {
  IAutoMoviePlaybackEntry,
  IAutoMoviePlaybackLayer,
  IAutoMoviePlaybackSample,
  IAutoMoviePlaybackTimeline,
  IAutoMovieSequence,
} from "@automovie/interface";

import { playbackEntryAt } from "./playbackEntryAt";
import { playbackSampleAt } from "./playbackSampleAt";

/*
 * The shots a picture of a sequence draws at one output instant, outgoing
 * first, each with its compositing weight.
 *
 * The live entry and the sample are those `resolveFromTimeline` gives, so they
 * equal what `playbackCursor` gives in a forward sweep. Outside a transition
 * the live entry is drawn alone at weight 1. Inside one, with `alpha` the
 * sample's progress, the layers follow `IAutoMovieTransition`:
 *
 * - `crossDissolve`: the outgoing tail at `1 - alpha` and the live entry at
 *   `alpha`;
 * - `fade`: before the midpoint, the outgoing tail alone at `1 - 2 × alpha`; from
 *   the midpoint on, the live entry alone at `2 × alpha - 1`, so the midpoint
 *   itself is the live entry at weight 0, black.
 *
 * `1 - alpha` and `alpha` add to exactly 1 in binary64 for every `alpha` in
 * `[0, 1)`, which the dissolve compositor's complementary-weight check needs.
 * Each layer's time is its entry's clock at `seconds`. The precondition is
 * `resolveFromTimeline`'s: a timeline from a sequence that passed
 * `cutSequence`.
 * Parameter sequence: The cut the timeline was built from.
 * Parameter timeline: The cut laid onto the output clock.
 * Parameter seconds: Output-clock seconds.
 * Returns: One or two new layers, outgoing first.
 */
export function playbackLayersAt(
  sequence: IAutoMovieSequence,
  timeline: IAutoMoviePlaybackTimeline,
  seconds: number,
): IAutoMoviePlaybackLayer[] {
  const live: IAutoMoviePlaybackEntry = playbackEntryAt(
    timeline.entries,
    seconds,
  );
  const sample: IAutoMoviePlaybackSample = playbackSampleAt(
    sequence,
    timeline.entries,
    live,
    seconds,
  );
  const incoming: (weight: number) => IAutoMoviePlaybackLayer = (
    weight: number,
  ): IAutoMoviePlaybackLayer => ({
    entry: live.entry,
    shot: sample.shot,
    time: sample.time,
    weight,
    live: true,
  });
  const blend: IAutoMoviePlaybackSample["blend"] = sample.blend;
  if (blend === null) return [incoming(1)];
  const outgoing: (weight: number) => IAutoMoviePlaybackLayer = (
    weight: number,
  ): IAutoMoviePlaybackLayer => ({
    entry: live.entry - 1,
    shot: blend.shot,
    time: blend.time,
    weight,
    live: false,
  });
  if (blend.kind === "crossDissolve")
    return [outgoing(1 - blend.alpha), incoming(blend.alpha)];
  return blend.alpha < 0.5
    ? [outgoing(1 - 2 * blend.alpha)]
    : [incoming(2 * blend.alpha - 1)];
}
