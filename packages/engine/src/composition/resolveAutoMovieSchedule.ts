import type { IAutoMovieSchedule, IAutoMovieComposition, IAutoMovieResolveSchedule, IAutoMovieScheduleWalk } from "@automovie/interface";

import { AutoMovieSchedulePlace } from "./AutoMovieSchedulePlace";
import { AutoMovieScheduleWalk } from "./AutoMovieScheduleWalk";

/**
 * Place a composition on the film clock with the production's pure laws.
 *
 * The walk is depth first in declaration order. A sequence starts each part
 * at the previous part's end; a parallel group starts every part at its own
 * start and ends at the latest end; `at` starts its part at the named
 * anchor's contact instant (its start when the timing gives no contact) plus
 * the offset, and the walk continues after the later of the cursor and that
 * part's end. An `at` that names an `event` reads that instant of the anchor,
 * which may then be a cue track of the laws, and one that names `align` asks
 * the laws' `align` when its part must start for that instant of the part's
 * first intent to fall there. An intent with `until` ends at its cut (a share of its
 * duration, the share of one of the events its timing names, or the share at
 * which the `until` law finds a proximity) and drops a contact after the cut;
 * a proximity the law reports as never met leaves the intent uncut, so it
 * runs to its end, while laws with no `until` at all cannot place a proximity
 * cut and throw; the entry records the cut, and the entry the next
 * part of a sequence places there records it as `interruptedBy`. For each
 * intent the production's `timing` gives its duration
 * and optional contact offset, then `outcome` and `state` read the entries
 * placed so far, so an outcome may depend on earlier state. The result is
 * frozen at the schedule, entries array and individual entry levels. Nested
 * intent, state, cut and event records remain shared and unfrozen; callers keep
 * them stable. Pure laws and unchanged inputs give the same schedule.
 *
 * @param composition The composition.
 * @param laws The production's pure timing, outcome and state functions.
 * @returns The frozen schedule.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Place a composition on the film clock with the production's pure laws) and documents parameters `composition`, `laws`, the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation A single depth-first walk of the composition tree in declaration order, the interval-placement scheme of a timeline composer: a sequence chains ends to starts, a parallel group takes the latest end, an `at` takes an anchor's instant plus an offset. The premises are seconds on the film clock, the laws being pure (the same inputs give the same schedule, and an aligned part is timed again at the start `laws.align` returns), and every reference resolving to a placed anchor, a cue track or an event, which the walk checks and refuses with an `AutoMovieScheduleError` naming the code, the subject and capability, the value and the alternatives (anchor, event, index, duplicate, share, timing and law). A cut is a share in [0, 1] of the duration, found from a share, an own event, another anchor's or a cue track's event, or the `until` law's proximity share; a proximity never met cuts nothing. A start-aligned part places once, an aligned one asks `laws.align` first.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One recursive `place` over the four node kinds: the sequence and the group are its own joints, an intent and an `at` are placed by `AutoMovieSchedulePlace`, the cut by `AutoMovieScheduleCut`, and the instant lookups and the walk's state are `AutoMovieScheduleWalk`'s; the error shapes sit in `AutoMovieScheduleError`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; two non-null assertions (`entries[first]!`, `interrupted.get(e.index)!`) follow a length or `has` check. The only numeric literals are the structural 0 and 1 of the [0, 1] share range and indices; every value comes from the composition or the laws.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pass over the n nodes of the composition; each anchor lookup is a map read, and each event lookup builds the anchor's instants and filters them, O(e) in that anchor's events. The result is one sort of the m entries, O(m log m), and one loop over their ends for the duration. No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 17 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function resolveAutoMovieSchedule(
  composition: IAutoMovieComposition,
  laws: IAutoMovieResolveSchedule.ILaws,
): IAutoMovieSchedule {
  const walk: IAutoMovieScheduleWalk.IWalk = AutoMovieScheduleWalk.create(laws);
  const place = (node: IAutoMovieComposition, start: number): number => {
    if (node.kind === "intent")
      return AutoMovieSchedulePlace.intent(walk, node.intent, start);
    if (node.kind === "sequence") {
      // The entry an intent's cut interrupts is the first one the next part places.
      let cutIndex: number | undefined;
      return node.parts.reduce(
        (at: number, part: IAutoMovieComposition): number => {
          const first: number = walk.entries.length;
          const end: number = place(part, at);
          if (cutIndex !== undefined && walk.entries.length > first)
            walk.interrupted.set(cutIndex, first);
          cutIndex =
            part.kind === "intent" &&
            walk.entries.length === first + 1 &&
            walk.entries[first]!.cut !== undefined
              ? first
              : undefined;
          return end;
        },
        start,
      );
    }
    if (node.kind === "parallel")
      return node.parts.reduce(
        (end: number, part: IAutoMovieComposition): number =>
          Math.max(end, place(part, start)),
        start,
      );
    return AutoMovieSchedulePlace.at(walk, node, start, place);
  };
  const end: number = place(composition, 0);
  const sorted: IAutoMovieSchedule.IEntry[] = [...walk.entries].sort(
    (a: IAutoMovieSchedule.IEntry, b: IAutoMovieSchedule.IEntry): number =>
      a.start - b.start || a.index - b.index,
  );
  let duration: number = end;
  for (const entry of walk.entries)
    if (entry.end > duration) duration = entry.end;
  return Object.freeze({
    entries: Object.freeze(
      sorted.map((e: IAutoMovieSchedule.IEntry) =>
        Object.freeze(
          walk.interrupted.has(e.index)
            ? { ...e, interruptedBy: walk.interrupted.get(e.index)! }
            : e,
        ),
      ),
    ),
    duration,
  });
}
