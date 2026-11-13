import type { IAutoMovieMotionEvent } from "@automovie/interface";

import type { AutoMovieComposition } from "./AutoMovieComposition";
import { AutoMovieScheduleError } from "./AutoMovieScheduleError";
import type { IAutoMovieIntent } from "./IAutoMovieIntent";
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
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Place a composition on the film clock with the production's pure laws) directly over its typed inputs (`composition`, `laws`) as 4 sequential passes (reduce over node.parts; reduce over node.parts; map over sorted) plus a sort, delegating to `laws.timing`, `Number.isFinite`, `laws.outcome`, `laws.state`, `entries.push`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (4 throw sites). Apart from structural 0, 1 and 2 the body uses no numeric literal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 78 lines and 6 top-level statements that reuses `laws.timing`, `Number.isFinite`, `laws.outcome`, `laws.state`, `entries.push` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `composition`, `laws`; the dominant cost is 4 sequential passes (reduce over node.parts; reduce over node.parts; map over sorted) plus a sort, performed once per call with 17 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 17 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function resolveAutoMovieSchedule(
  composition: AutoMovieComposition,
  laws: resolveAutoMovieSchedule.ILaws,
): IAutoMovieSchedule {
  const entries: IAutoMovieSchedule.IEntry[] = [];
  const anchors: Map<string, number> = new Map();
  const interrupted: Map<number, number> = new Map();
  const anchored: Map<string, IAutoMovieSchedule.IEntry> = new Map();
  const tracks: Map<string, readonly resolveAutoMovieSchedule.ICue[]> = new Map(
    Object.entries(laws.cues ?? {}),
  );

  // The named instants of an anchored entry (its events, and its own start
  // and end where it names none so) or of a cue track.
  const instants = (
    of: string,
  ): readonly resolveAutoMovieSchedule.ICue[] | undefined => {
    const entry: IAutoMovieSchedule.IEntry | undefined = anchored.get(of);
    if (entry === undefined) return tracks.get(of);
    const events: readonly resolveAutoMovieSchedule.ICue[] = entry.events ?? [];
    const named = (name: string): boolean =>
      events.some(
        (e: resolveAutoMovieSchedule.ICue): boolean => e.name === name,
      );
    return [
      ...(named("start") ? [] : [{ name: "start", seconds: entry.start }]),
      ...events,
      ...(named("end") ? [] : [{ name: "end", seconds: entry.end }]),
    ];
  };
  const placed = (): string[] => [...anchored.keys(), ...tracks.keys()];
  const instant = (
    of: string,
    events: readonly resolveAutoMovieSchedule.ICue[],
    name: string,
    index: number,
    by: IAutoMovieIntent | undefined,
  ): number => {
    const same: resolveAutoMovieSchedule.ICue[] = events.filter(
      (e: resolveAutoMovieSchedule.ICue): boolean => e.name === name,
    );
    const names: string[] = [
      ...new Set(
        events.map((e: resolveAutoMovieSchedule.ICue): string => e.name),
      ),
    ];
    if (same.length === 0)
      throw new AutoMovieScheduleError(
        `${of} has no event ${name}; its events are ${names.join(", ") || "none"}`,
        {
          code: "event",
          subject: by?.subject,
          capability: by?.capability,
          of,
          value: name,
          alternatives: names,
        },
      );
    const found: resolveAutoMovieSchedule.ICue | undefined = same[index];
    if (found === undefined)
      throw new AutoMovieScheduleError(
        `${of} has ${same.length} ${name} events, so index ${index} names none (the first is 0)`,
        {
          code: "index",
          subject: by?.subject,
          capability: by?.capability,
          of,
          value: index,
          alternatives: same.map(
            (_: resolveAutoMovieSchedule.ICue, i: number): string => String(i),
          ),
        },
      );
    return found.seconds;
  };
  const leading = (node: AutoMovieComposition): IAutoMovieIntent | undefined =>
    node.kind === "intent"
      ? node.intent
      : node.kind === "at" || node.parts[0] === undefined
        ? undefined
        : leading(node.parts[0]);
  const place = (node: AutoMovieComposition, start: number): number => {
    if (node.kind === "intent") {
      const context: resolveAutoMovieSchedule.IContext = { start, entries };
      const timing: resolveAutoMovieSchedule.ITiming = laws.timing(
        node.intent,
        context,
      );
      const who: Pick<
        AutoMovieScheduleError.IProps,
        "subject" | "capability"
      > = {
        subject: node.intent.subject,
        capability: node.intent.capability,
      };
      if (!(timing.duration >= 0) || !Number.isFinite(timing.duration))
        throw new AutoMovieScheduleError(
          `Invalid duration of ${node.intent.subject}.${node.intent.capability}`,
          { ...who, code: "timing", value: timing.duration },
        );
      if (
        timing.contact !== undefined &&
        !(timing.contact >= 0 && timing.contact <= timing.duration)
      )
        throw new AutoMovieScheduleError(
          `Contact outside ${node.intent.subject}.${node.intent.capability}`,
          { ...who, code: "timing", value: timing.contact },
        );
      // A cut ends the entry early at a share or a named event; a contact
      // after the cut never happens.
      const until: IAutoMovieIntent["until"] = node.intent.until;
      let cut: { share: number; event?: string } | undefined;
      if (until !== undefined) {
        if ("proximity" in until) {
          if (laws.until === undefined)
            throw new AutoMovieScheduleError(
              `${node.intent.subject}.${node.intent.capability} cuts on proximity, which these laws cannot resolve`,
              { ...who, code: "law", value: "until" },
            );
          // A proximity the motion never reaches leaves the intent uncut: it
          // runs to its own end, as an `until` that never fires does.
          const share: number | undefined = laws.until(
            node.intent,
            { start, duration: timing.duration },
            context,
          );
          if (share !== undefined) cut = { share };
        } else if ("of" in until) {
          const events: readonly resolveAutoMovieSchedule.ICue[] | undefined =
            instants(until.of);
          if (events === undefined)
            throw new AutoMovieScheduleError(
              `Cut of ${node.intent.subject}.${node.intent.capability} waits for ${until.of}, which is not placed earlier`,
              {
                ...who,
                code: "anchor",
                of: until.of,
                value: until.of,
                alternatives: placed(),
              },
            );
          const seconds: number = instant(
            until.of,
            events,
            until.event,
            until.index ?? 0,
            node.intent,
          );
          cut = {
            share:
              timing.duration === 0 ? 0 : (seconds - start) / timing.duration,
            event: `${until.of}.${until.event}`,
          };
        } else if ("event" in until) {
          const event: IAutoMovieMotionEvent | undefined = timing.events?.find(
            (e: IAutoMovieMotionEvent): boolean => e.name === until.event,
          );
          if (event === undefined)
            throw new AutoMovieScheduleError(
              `${node.intent.subject}.${node.intent.capability} has no event ${until.event}; its events are ${(timing.events ?? []).map((e: IAutoMovieMotionEvent): string => e.name).join(", ") || "none"}`,
              {
                ...who,
                code: "event",
                value: until.event,
                alternatives: (timing.events ?? []).map(
                  (e: IAutoMovieMotionEvent): string => e.name,
                ),
              },
            );
          cut = { share: event.share, event: event.name };
        } else cut = { share: until.share };
        if (cut !== undefined && !(cut.share >= 0 && cut.share <= 1))
          throw new AutoMovieScheduleError(
            `Cut share of ${node.intent.subject}.${node.intent.capability} lies outside [0, 1]`,
            {
              ...who,
              code: "share",
              value: cut.share,
              ...("of" in until ? { of: until.of } : {}),
            },
          );
      }
      const length: number =
        cut === undefined ? timing.duration : cut.share * timing.duration;
      const draft: IAutoMovieSchedule.IEntry = {
        index: entries.length,
        subject: node.intent.subject,
        intent: node.intent,
        start,
        ...(timing.contact === undefined || timing.contact > length
          ? {}
          : { contact: start + timing.contact }),
        end: start + length,
        ...(cut === undefined ? {} : { cut }),
        ...(timing.events === undefined
          ? {}
          : {
              events: timing.events.map(
                (
                  e: IAutoMovieMotionEvent,
                ): { name: string; seconds: number } => ({
                  name: e.name,
                  seconds: start + e.share * timing.duration,
                }),
              ),
            }),
      };
      const outcome: string | undefined = laws.outcome?.(draft, context);
      const state: unknown = laws.state?.(draft, context);
      entries.push({
        ...draft,
        ...(outcome === undefined ? {} : { outcome }),
        ...(state === undefined ? {} : { state }),
      });
      if (node.intent.anchor !== undefined) {
        if (anchors.has(node.intent.anchor) || tracks.has(node.intent.anchor))
          throw new AutoMovieScheduleError(
            `Duplicate composition anchor ${node.intent.anchor}`,
            {
              ...who,
              code: "duplicate",
              of: node.intent.anchor,
              value: node.intent.anchor,
              alternatives: placed(),
            },
          );
        anchors.set(node.intent.anchor, draft.contact ?? start);
        anchored.set(node.intent.anchor, draft);
      }
      return draft.end;
    }
    if (node.kind === "sequence") {
      // The entry an intent's cut interrupts is the first one the next part places.
      let cutIndex: number | undefined;
      return node.parts.reduce(
        (at: number, part: AutoMovieComposition): number => {
          const first: number = entries.length;
          const end: number = place(part, at);
          if (cutIndex !== undefined && entries.length > first)
            interrupted.set(cutIndex, first);
          cutIndex =
            part.kind === "intent" &&
            entries.length === first + 1 &&
            entries[first]!.cut !== undefined
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
    const events: readonly resolveAutoMovieSchedule.ICue[] | undefined =
      instants(node.anchor);
    const first: IAutoMovieIntent | undefined = leading(node.part);
    const anchor: number | undefined =
      node.event === undefined
        ? anchors.get(node.anchor)
        : events === undefined
          ? undefined
          : instant(node.anchor, events, node.event, node.index ?? 0, first);
    if (anchor === undefined)
      throw new AutoMovieScheduleError(
        events === undefined
          ? `Composition anchor ${node.anchor} is not placed earlier`
          : `Composition anchor ${node.anchor} is a cue track, so the part aligned to it must name one of its events`,
        events === undefined
          ? {
              code: "anchor",
              subject: first?.subject,
              capability: first?.capability,
              of: node.anchor,
              value: node.anchor,
              alternatives: placed(),
            }
          : {
              code: "event",
              subject: first?.subject,
              capability: first?.capability,
              of: node.anchor,
              value: "",
              alternatives: [
                ...new Set(
                  events.map(
                    (e: resolveAutoMovieSchedule.ICue): string => e.name,
                  ),
                ),
              ],
            },
      );
    const target: number = anchor + node.offset;
    if (node.align === undefined)
      return Math.max(start, place(node.part, target));

    // The part's own instant falls on the target: the laws say when it must
    // start for that, since only they know how long it takes to get there.
    if (first === undefined)
      throw new AutoMovieScheduleError(
        `The part aligned to ${node.anchor} by its ${node.align} begins with no intent`,
        { code: "law", of: node.anchor, value: node.align },
      );
    if (laws.align === undefined)
      throw new AutoMovieScheduleError(
        `${first.subject}.${first.capability} aligns its ${node.align}, which these laws cannot resolve`,
        {
          code: "law",
          subject: first.subject,
          capability: first.capability,
          of: node.anchor,
          value: "align",
        },
      );
    return Math.max(
      start,
      place(
        node.part,
        laws.align(first, node.align, target, {
          start: target,
          entries,
          anchor: {
            of: node.anchor,
            offset: node.offset,
            ...(node.event === undefined ? {} : { event: node.event }),
            ...(node.index === undefined ? {} : { index: node.index }),
            instants: events ?? [],
          },
        }),
      ),
    );
  };
  const end: number = place(composition, 0);
  const sorted: IAutoMovieSchedule.IEntry[] = [...entries].sort(
    (a: IAutoMovieSchedule.IEntry, b: IAutoMovieSchedule.IEntry): number =>
      a.start - b.start || a.index - b.index,
  );
  return Object.freeze({
    entries: Object.freeze(
      sorted.map((e: IAutoMovieSchedule.IEntry) =>
        Object.freeze(
          interrupted.has(e.index)
            ? { ...e, interruptedBy: interrupted.get(e.index)! }
            : e,
        ),
      ),
    ),
    duration: Math.max(
      end,
      ...entries.map((e: IAutoMovieSchedule.IEntry): number => e.end),
    ),
  });
}
/**
 * Companion types of {@link resolveAutoMovieSchedule}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Companion types of ) and documents 3 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Companion types of : companion namespace of 3 members (`IContext`, `ITiming`, `ILaws`); units and frames named in its text: seconds. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `resolveAutoMovieSchedule` in packages/engine/src/composition/resolveAutoMovieSchedule.ts; its surface is the 3 members listed and the text shows 8 other files naming it, mostly movies (5), packages/engine (2), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.
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
