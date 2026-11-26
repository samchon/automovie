import type {
  IAutoMovieComposition,
  IAutoMovieIntent,
  IAutoMovieIntentTiming,
  IAutoMovieMotionEvent,
  IAutoMovieScheduleContext,
  IAutoMovieScheduleCue,
  IAutoMovieScheduleCut,
  IAutoMovieScheduleEntry,
  IAutoMovieScheduleError,
  IAutoMovieScheduleWalk,
} from "@automovie/interface";

import { AutoMovieEngineScheduleCut } from "./AutoMovieEngineScheduleCut";
import { AutoMovieScheduleError } from "./AutoMovieScheduleError";
import { AutoMovieScheduleWalk } from "./AutoMovieScheduleWalk";

/**
 * The two placements of a composition's leaves and joints that the walk does
 * not do itself: an intent placed on the film clock, and a part placed at an
 * anchor's instant.
 */
export namespace AutoMovieSchedulePlace {
  /**
   * Place one intent: its timing, its cut, its entry with the outcome and the
   * state the laws read of it, and its anchor.
   *
   * @param walk The walk.
   * @param intent The intent.
   * @param start Where it starts, film seconds.
   * @returns Where it ends, film seconds.
   * @throws {AutoMovieScheduleError} When its timing is invalid, its cut is, or
   *   its anchor is already placed.
   */
  export function intent(
    walk: IAutoMovieScheduleWalk.IWalk,
    intent: IAutoMovieIntent,
    start: number,
  ): number {
    const context: IAutoMovieScheduleContext = {
      start,
      entries: walk.entries,
      ...(walk.demand === undefined ? {} : { demand: walk.demand }),
      ...(walk.horizon === undefined ? {} : { horizon: walk.horizon }),
      ...(walk.meeting === undefined ? {} : { meeting: walk.meeting }),
      ...(walk.demandAnchor === undefined
        ? {}
        : { demandAnchor: walk.demandAnchor }),
    };
    const timing: IAutoMovieIntentTiming = walk.laws.timing(intent, context);
    const who: Pick<IAutoMovieScheduleError.IProps, "subject" | "capability"> =
      {
        subject: intent.subject,
        capability: intent.capability,
      };
    if (!(timing.duration >= 0))
      throw new AutoMovieScheduleError(
        `Invalid duration of ${intent.subject}.${intent.capability}`,
        { ...who, code: "timing", value: timing.duration },
      );
    if (
      timing.contact !== undefined &&
      !(timing.contact >= 0 && timing.contact <= timing.duration)
    )
      throw new AutoMovieScheduleError(
        `Contact outside ${intent.subject}.${intent.capability}`,
        { ...who, code: "timing", value: timing.contact },
      );
    // A cut ends the entry early at a share or a named event; a contact
    // after the cut never happens.
    const cut: IAutoMovieScheduleCut.ICut | undefined =
      AutoMovieEngineScheduleCut.of(walk, intent, timing, start, context);
    const length: number =
      cut === undefined ? timing.duration : cut.share * timing.duration;
    // The index is read after the timing, since a law's demand may have
    // placed another part's entries meanwhile (`IAutoMovieScheduleContext.demand`).
    const draft: IAutoMovieScheduleEntry = {
      index: walk.entries.length,
      subject: intent.subject,
      intent,
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
    const outcome: string | undefined = walk.laws.outcome?.(draft, context);
    const state: unknown = walk.laws.state?.(draft, context);
    walk.entries.push({
      ...draft,
      ...(outcome === undefined ? {} : { outcome }),
      ...(state === undefined ? {} : { state }),
    });
    walk.last = draft.index;
    if (intent.anchor !== undefined) {
      if (walk.anchors.has(intent.anchor) || walk.tracks.has(intent.anchor))
        throw new AutoMovieScheduleError(
          `Duplicate composition anchor ${intent.anchor}`,
          {
            ...who,
            code: "duplicate",
            of: intent.anchor,
            value: intent.anchor,
            alternatives: AutoMovieScheduleWalk.placed(walk),
          },
        );
      walk.anchors.set(intent.anchor, draft.contact ?? start);
      walk.anchored.set(intent.anchor, draft);
    }
    return draft.end;
  }

  /**
   * Place a part at an anchor's instant plus an offset, or, when it names an
   * `align`, at the start the laws say makes its instant fall there.
   *
   * @param walk The walk.
   * @param node The `at` node.
   * @param start The cursor, film seconds.
   * @param place The walk's placement of a node, for the part.
   * @returns Where the sequence goes on (`resume`): the part's end when it cuts
   *   its own subject's action that set the cursor, else the later of the
   *   cursor and the part's end, film seconds.
   * @throws {AutoMovieScheduleError} When the anchor or its event is not
   *   placed, an occurrence index names no event, the part has no intent to
   *   align, or the laws cannot align.
   */
  export function at(
    walk: IAutoMovieScheduleWalk.IWalk,
    node: Extract<IAutoMovieComposition, { type: "at" }>,
    start: number,
    place: (part: IAutoMovieComposition, from: number) => number,
  ): number {
    const events: readonly IAutoMovieScheduleCue[] | undefined =
      AutoMovieScheduleWalk.instants(walk, node.anchor);
    const first: IAutoMovieIntent | undefined = AutoMovieScheduleWalk.leading(
      node.part,
    );
    // An index counts the occurrences of an event; with no event it would
    // be read as nothing and the part placed at the anchor's contact.
    if (node.event === undefined && node.index !== undefined)
      throw new AutoMovieScheduleError(
        `The part aligned to ${node.anchor} names occurrence ${node.index} of no event; name the event the index counts`,
        {
          code: "index",
          subject: first?.subject,
          capability: first?.capability,
          of: node.anchor,
          value: node.index,
        },
      );
    // An anchor a waiting part of an open group holds is placed first
    // (`IAutoMovieScheduleContext.demandAnchor`), as a law's read of it is.
    if (
      node.event === undefined &&
      !walk.anchors.has(node.anchor) &&
      walk.demandAnchor !== undefined
    )
      walk.demandAnchor(node.anchor);
    const anchor: number | undefined =
      node.event === undefined
        ? walk.anchors.get(node.anchor)
        : events === undefined
          ? undefined
          : AutoMovieScheduleWalk.instant(
              node.anchor,
              events,
              node.event,
              node.index ?? 0,
              first,
            );
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
              alternatives: AutoMovieScheduleWalk.placed(walk),
            }
          : {
              code: "event",
              subject: first?.subject,
              capability: first?.capability,
              of: node.anchor,
              value: "",
              alternatives: [
                ...new Set(
                  events.map((e: IAutoMovieScheduleCue): string => e.name),
                ),
              ],
            },
      );
    const target: number = anchor + node.offset;
    const before: number = walk.entries.length;
    if (node.align === undefined)
      return resume(walk, first, start, before, place(node.part, target));

    // The part's own instant falls on the target: the laws say when it must
    // start for that, since only they know how long it takes to get there.
    if (first === undefined)
      throw new AutoMovieScheduleError(
        `The part aligned to ${node.anchor} by its ${node.align} begins with no intent`,
        { code: "law", of: node.anchor, value: node.align },
      );
    if (walk.laws.align === undefined)
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
    return resume(
      walk,
      first,
      start,
      before,
      place(
        node.part,
        walk.laws.align(first, node.align, target, {
          start: target,
          entries: walk.entries,
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
  }

  /**
   * Where a sequence goes on after a part placed at an instant: from the later
   * of the cursor and the part's end, unless the part starts inside the action
   * of its own subject that set the cursor. That action is cut where the part
   * starts (the laws' cancel tables say whether it may be), so what follows
   * starts from the part's end, not from the cut action's uncut one.
   *
   * @param walk The walk.
   * @param first The part's leading intent.
   * @param start The cursor, film seconds.
   * @param before How many entries were placed before the part.
   * @param end The part's end, film seconds.
   * @returns Where the sequence goes on, film seconds.
   */
  function resume(
    walk: IAutoMovieScheduleWalk.IWalk,
    first: IAutoMovieIntent | undefined,
    start: number,
    before: number,
    end: number,
  ): number {
    // A law's demand may place another part's entries among the part's own
    // (`IAutoMovieScheduleContext.demand`), so the part is found by its intent.
    const placed: IAutoMovieScheduleEntry | undefined = walk.entries.find(
      (e: IAutoMovieScheduleEntry, i: number): boolean =>
        i >= before && e.intent === first,
    );
    const cut: boolean =
      first !== undefined &&
      placed !== undefined &&
      walk.entries
        .slice(0, before)
        .some(
          (e: IAutoMovieScheduleEntry): boolean =>
            e.subject === first.subject &&
            e.end === start &&
            e.start <= placed.start &&
            placed.start < e.end,
        );
    return cut ? end : Math.max(start, end);
  }
}
