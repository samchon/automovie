import type {
  IAutoMovieDeliveredCutEntry,
  IAutoMoviePlaybackEntry,
  IAutoMoviePlaybackTimeline,
} from "@automovie/interface";

/*
 * Map a film's cut onto the frames a render drew: one row per timeline entry,
 * in entry order, with the output frames that entry is live in.
 *
 * `times` are the drawn frames' instants in output seconds, `frameTimes`' `i /
 * fps`, in increasing order. Frame `i` is live in the entry with the highest
 * index whose `start` is at or before `times[i]`, the rule `playbackCursor`
 * samples by, compared on the same floating-point instants the render drew at,
 * so a start that falls on a frame instant is never rounded to the neighbouring
 * frame. Frames before the first entry's start belong to the first entry, as
 * the cursor starts there.
 *
 * Each row copies `entry`, `shot`, `start`, `played` and `offset`, and
 * `playbackRate` only when the entry has one. Rows are keyed by `entry`; a shot
 * played twice keeps both rows. An entry passed over before any frame instant
 * reaches it, because the next entry starts at or before its first instant,
 * gets the empty range `[k, k)`. The ranges tile `[0, times.length)`.
 *
 * It throws for a timeline with no entries, which has no entry to be live in.
 */
export function planAutoMovieDeliveredCut(props: {
  /*
   * The film's cut on the output clock, entries in sequence order with
   * non-decreasing starts.
   */
  timeline: IAutoMoviePlaybackTimeline;

  /*
   * The drawn frames' instants in output seconds, increasing.
   */
  times: readonly number[];
}): IAutoMovieDeliveredCutEntry[] {
  const { entries }: IAutoMoviePlaybackTimeline = props.timeline;
  if (entries.length === 0)
    throw new Error("A cut needs at least one timeline entry");

  // One sweep: `live` advances as the cursor does, and each entry's first live
  // frame is the frame at which the sweep first reaches it.
  const firsts: number[] = entries.map((): number => props.times.length);
  firsts[0] = 0;
  let live: number = 0;
  for (const [index, seconds] of props.times.entries())
    while (live + 1 < entries.length && entries[live + 1]!.start <= seconds) {
      ++live;
      firsts[live] = index;
    }

  return entries.map(
    (
      entry: IAutoMoviePlaybackEntry,
      index: number,
    ): IAutoMovieDeliveredCutEntry => ({
      entry: entry.entry,
      shot: entry.shot,
      start: entry.start,
      played: entry.played,
      offset: entry.offset,
      ...(entry.playbackRate === undefined
        ? {}
        : { playbackRate: entry.playbackRate }),
      liveFrames: [
        firsts[index]!,
        index + 1 < entries.length ? firsts[index + 1]! : props.times.length,
      ],
    }),
  );
}
