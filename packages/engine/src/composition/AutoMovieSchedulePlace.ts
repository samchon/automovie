import type { IAutoMovieMotionEvent } from "@automovie/interface";

import type { AutoMovieComposition } from "./AutoMovieComposition";
import { AutoMovieScheduleCut } from "./AutoMovieScheduleCut";
import { AutoMovieScheduleError } from "./AutoMovieScheduleError";
import { AutoMovieScheduleWalk } from "./AutoMovieScheduleWalk";
import type { IAutoMovieIntent } from "./IAutoMovieIntent";
import type { IAutoMovieSchedule } from "./IAutoMovieSchedule";
import type { resolveAutoMovieSchedule } from "./resolveAutoMovieSchedule";

/**
 * The two placements of a composition's leaves and joints that the walk does
 * not do itself: an intent placed on the film clock, and a part placed at an
 * anchor's instant.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two placements and what each refuses.
 * @evidence contracts/development/design.md#principled-representation An intent becomes an entry with its start, contact, cut, events, outcome and state; an `at` becomes the start its anchor and its alignment give.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two functions; the sequence and the group are the walk's own joints.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every invalid timing, duplicate, unplaced anchor and absent law is refused with its code.
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
   * @throws {AutoMovieScheduleError} When its timing is invalid, its cut is, or its anchor is already placed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the end and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The laws time the intent, the cut shortens it, then `outcome` and `state` read the entries placed so far and the draft, so an outcome may depend on earlier state.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Validate the timing, cut, build the draft, push the entry, name the anchor.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A duration, a contact or an anchor name that is not valid is refused.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the intent's events.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reuses the cut and the walk's readings.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The entry joins the walk's list and nothing else is kept.
   */
  export function intent(
    walk: AutoMovieScheduleWalk.IWalk,
    intent: IAutoMovieIntent,
    start: number,
  ): number {
    const context: resolveAutoMovieSchedule.IContext = {
      start,
      entries: walk.entries,
    };
    const timing: resolveAutoMovieSchedule.ITiming = walk.laws.timing(
      intent,
      context,
    );
    const who: Pick<AutoMovieScheduleError.IProps, "subject" | "capability"> = {
      subject: intent.subject,
      capability: intent.capability,
    };
    if (!(timing.duration >= 0) || !Number.isFinite(timing.duration))
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
    const cut: AutoMovieScheduleCut.ICut | undefined = AutoMovieScheduleCut.of(
      walk,
      intent,
      timing,
      start,
      context,
    );
    const length: number =
      cut === undefined ? timing.duration : cut.share * timing.duration;
    const draft: IAutoMovieSchedule.IEntry = {
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
   * @returns The later of the cursor and the part's end, film seconds.
   * @throws {AutoMovieScheduleError} When the anchor or its event is not placed, the part has no intent to align, or the laws cannot align.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the end and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The anchor's contact instant (its start when it has none) or its named event, plus the offset, is the target; an aligned part asks `laws.align` for the start that puts its own instant on it and is then timed again there.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the target, then place directly or through the alignment.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A cue track named without an event, an unplaced anchor, a part with no intent to align and laws without `align` are refused.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work besides the part and the anchor's instants.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads the walk's instants.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function at(
    walk: AutoMovieScheduleWalk.IWalk,
    node: Extract<AutoMovieComposition, { kind: "at" }>,
    start: number,
    place: (part: AutoMovieComposition, from: number) => number,
  ): number {
    const events: readonly resolveAutoMovieSchedule.ICue[] | undefined =
      AutoMovieScheduleWalk.instants(walk, node.anchor);
    const first: IAutoMovieIntent | undefined = AutoMovieScheduleWalk.leading(
      node.part,
    );
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
    return Math.max(
      start,
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
}
