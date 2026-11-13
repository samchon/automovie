import type { IAutoMovieMotionEvent } from "@automovie/interface";

import type { AutoMovieComposition } from "./AutoMovieComposition";
import { AutoMovieSchedulePlace } from "./AutoMovieSchedulePlace";
import { AutoMovieScheduleWalk } from "./AutoMovieScheduleWalk";
import type { IAutoMovieSchedule } from "./IAutoMovieSchedule";

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
 * deeply frozen; the same composition and laws give the same schedule.
 *
 * @param composition The composition.
 * @param laws The production's pure timing, outcome and state functions.
 * @returns The frozen schedule.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Place a composition on the film clock with the production's pure laws) and documents parameters `composition`, `laws`, the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation A single depth-first walk of the composition tree in declaration order, the interval-placement scheme of a timeline composer: a sequence chains ends to starts, a parallel group takes the latest end, an `at` takes an anchor's instant plus an offset. The premises are seconds on the film clock, the laws being pure (the same inputs give the same schedule, and an aligned part is timed again at the start `laws.align` returns), and every reference resolving to a placed anchor, a cue track or an event, which the walk checks and refuses with an `AutoMovieScheduleError` naming the code, the subject and capability, the value and the alternatives (anchor, event, index, duplicate, share, timing and law). A cut is a share in [0, 1] of the duration, found from a share, an own event, another anchor's or a cue track's event, or the `until` law's proximity share; a proximity never met cuts nothing. A start-aligned part places once, an aligned one asks `laws.align` first.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One recursive `place` over the four node kinds: the sequence and the group are its own joints, an intent and an `at` are placed by `AutoMovieSchedulePlace`, the cut by `AutoMovieScheduleCut`, and the instant lookups and the walk's state are `AutoMovieScheduleWalk`'s; the error shapes sit in `AutoMovieScheduleError`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; two non-null assertions (`entries[first]!`, `interrupted.get(e.index)!`) follow a length or `has` check. The only numeric literals are the structural 0 and 1 of the [0, 1] share range and indices; every value comes from the composition or the laws.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pass over the n nodes of the composition; each anchor lookup is a map read, and each event lookup builds the anchor's instants and filters them, O(e) in that anchor's events. The result is one sort of the m entries, O(m log m), and one loop over their ends for the duration. No speedup is claimed and none is measured. * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 17 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function resolveAutoMovieSchedule(
  composition: AutoMovieComposition,
  laws: resolveAutoMovieSchedule.ILaws,
): IAutoMovieSchedule {
  const walk: AutoMovieScheduleWalk.IWalk = AutoMovieScheduleWalk.create(laws);
  const place = (node: AutoMovieComposition, start: number): number => {
    if (node.kind === "intent")
      return AutoMovieSchedulePlace.intent(walk, node.intent, start);
    if (node.kind === "sequence") {
      // The entry an intent's cut interrupts is the first one the next part places.
      let cutIndex: number | undefined;
      return node.parts.reduce(
        (at: number, part: AutoMovieComposition): number => {
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
        (end: number, part: AutoMovieComposition): number =>
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
  for (const entry of walk.entries) if (entry.end > duration) duration = entry.end;
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

/**
 * Companion types of {@link resolveAutoMovieSchedule}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Documents each of the 5 members (`IContext`, `IAlignment`, `ITiming`, `ICue`, `ILaws`): what the laws see, in film seconds, and what each law returns or leaves absent.
 * @evidence contracts/development/design.md#principled-representation Companion namespace of 5 members; every time is seconds on the film clock, a cut is a share of the duration, and the optional laws (`cues`, `align`, `until`, `outcome`, `state`) state what an absent one means: no tracks, an alignment or proximity cut that throws a `law` error, no outcome, no state.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by `resolveAutoMovieSchedule`, whose `laws` argument is typed by `ILaws`; the motions' performance supplies the laws and reads `IContext`, `IAlignment` and `ICue`, so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The one widening is `ILaws.state`, which returns `unknown` because the production owns the shape of its state snapshot and the engine only stores it on the entry; there is no `any`, no index signature and no cast, and the types of `@automovie/interface` are imported, not duplicated.
 */
export namespace resolveAutoMovieSchedule {
  /** What the laws see while an intent is placed. */
  export interface IContext {
    /** The intent's start, seconds. */
    start: number;

    /** Entries placed so far, in walk order. */
    entries: readonly IAutoMovieSchedule.IEntry[];
  }

  /**
   * What the laws see while an aligned part's start is found: the placing
   * context, and the instant the part is aligned to with every instant the
   * same anchor or track offers, so laws that cannot meet the one asked can
   * say which later one they can.
   */
  export interface IAlignment extends IContext {
    /** The instant aligned to. */
    anchor: {
      /** The anchor or cue track. */
      of: string;

      /** The event named; the anchor's contact or start when absent. */
      event?: string;

      /** The occurrence of the event, from 0; the first when absent. */
      index?: number;

      /** Seconds added to the instant. */
      offset: number;

      /** Every named instant of the anchor or track, in film seconds. */
      instants: readonly ICue[];
    };
  }

  /** An intent's timing. */
  export interface ITiming {
    /** Seconds the intent takes; nonnegative. */
    duration: number;

    /** Seconds from the start to its contact or decisive instant, within the duration. */
    contact?: number;

    /** Named instants as shares of the duration, which `until: { event }` cuts at. */
    events?: readonly IAutoMovieMotionEvent[];
  }

  /** A named instant of a cue track or of a placed entry. */
  export interface ICue {
    /** The instant's name; a track may repeat one, as a score repeats `beat`. */
    name: string;

    /** Film seconds. */
    seconds: number;
  }

  /** The production's pure laws. */
  export interface ILaws {
    /**
     * Tracks of named instants that belong to no intent, by track name: a
     * dialogue's line starts and accents, a score's beats. A part aligns to
     * one and an intent is cut on one as on an anchored intent's events.
     */
    cues?: Readonly<Record<string, readonly ICue[]>>;

    /**
     * The second an intent must start at for its named instant to fall on a
     * target second. It places nothing: the intent is timed again when it
     * is placed at the second returned.
     */
    align?(
      intent: IAutoMovieIntent,
      instant: string,
      target: number,
      context: IAlignment,
    ): number;

    /** Duration and contact of an intent. */
    timing(intent: IAutoMovieIntent, context: IContext): ITiming;

    /**
     * The share of an intent's duration at which a `proximity` cut happens,
     * found from the production's motion, or undefined when it never does.
     */
    until?(
      intent: IAutoMovieIntent,
      placed: { start: number; duration: number },
      context: IContext,
    ): number | undefined;

    /** Outcome class of a placed entry, if any. */
    outcome?(
      entry: IAutoMovieSchedule.IEntry,
      context: IContext,
    ): string | undefined;

    /** State snapshot after a placed entry, if any. */
    state?(entry: IAutoMovieSchedule.IEntry, context: IContext): unknown;
  }
}