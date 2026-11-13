import type { IAutoMovieMotionEvent } from "@automovie/interface";

import { AutoMovieScheduleError } from "./AutoMovieScheduleError";
import { AutoMovieScheduleWalk } from "./AutoMovieScheduleWalk";
import type { IAutoMovieIntent } from "./IAutoMovieIntent";
import type { resolveAutoMovieSchedule } from "./resolveAutoMovieSchedule";

/**
 * Where an intent's `until` cuts it: a share of its duration, found from a
 * share, an event of its own timing, another anchor's or a cue track's event,
 * or the `until` law's proximity share.
 *
 * A proximity the law reports as never met leaves the intent uncut, so it runs
 * to its end; laws with no `until` at all cannot place a proximity cut and
 * throw.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the four kinds of cut, what a proximity never met does and the refusals.
 * @evidence contracts/development/design.md#principled-representation A cut is a share in [0, 1] of the duration with the event it was found at.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function; the walk places the entry the cut shortens.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A cut outside [0, 1], an unplaced anchor, an unnamed event and a law that is absent are refused with their codes.
 */
export namespace AutoMovieScheduleCut {
  /**
   * A cut: its share of the duration and the event it was found at.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's meaning and range.
   * @evidence contracts/development/design.md#principled-representation A cut is a share in [0, 1] of the duration, with the event it was found at when it was found at one.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both written onto the schedule's entry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No intent or law is named; the event is optional because a share needs none.
   */
  export interface ICut {
    /** The share of the duration, in [0, 1]. */
    share: number;

    /** The event the cut was found at, `of.event` for another anchor's. */
    event?: string;
  }

  /**
   * The cut of an intent.
   *
   * @param walk The walk.
   * @param intent The intent.
   * @param timing Its timing.
   * @param start Where it starts, film seconds.
   * @param context What the laws see while it is placed.
   * @returns The cut, or undefined when nothing cuts it.
   * @throws {AutoMovieScheduleError} When the law, the anchor, the event or the share is not valid.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The cut kinds are told apart by their key; an anchor's instant is read as an `at` reads it, and its share is taken against this intent's duration.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per cut kind and one range check.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every cut is checked to lie in [0, 1] before it is used.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One law call at most, and the anchor lookups of `AutoMovieScheduleWalk`.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Reads the walk's instants and does not repeat them.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function of(
    walk: AutoMovieScheduleWalk.IWalk,
    intent: IAutoMovieIntent,
    timing: resolveAutoMovieSchedule.ITiming,
    start: number,
    context: resolveAutoMovieSchedule.IContext,
  ): ICut | undefined {
    const until: IAutoMovieIntent["until"] = intent.until;
    if (until === undefined) return undefined;
    const who: Pick<AutoMovieScheduleError.IProps, "subject" | "capability"> = {
      subject: intent.subject,
      capability: intent.capability,
    };
    let cut: ICut | undefined;
    if ("proximity" in until) {
      if (walk.laws.until === undefined)
        throw new AutoMovieScheduleError(
          `${intent.subject}.${intent.capability} cuts on proximity, which these laws cannot resolve`,
          { ...who, code: "law", value: "until" },
        );
      // A proximity the motion never reaches leaves the intent uncut: it
      // runs to its own end, as an `until` that never fires does.
      const share: number | undefined = walk.laws.until(
        intent,
        { start, duration: timing.duration },
        context,
      );
      if (share !== undefined) cut = { share };
    } else if ("of" in until) {
      const events: readonly resolveAutoMovieSchedule.ICue[] | undefined =
        AutoMovieScheduleWalk.instants(walk, until.of);
      if (events === undefined)
        throw new AutoMovieScheduleError(
          `Cut of ${intent.subject}.${intent.capability} waits for ${until.of}, which is not placed earlier`,
          {
            ...who,
            code: "anchor",
            of: until.of,
            value: until.of,
            alternatives: AutoMovieScheduleWalk.placed(walk),
          },
        );
      const seconds: number = AutoMovieScheduleWalk.instant(
        until.of,
        events,
        until.event,
        until.index ?? 0,
        intent,
      );
      cut = {
        share: timing.duration === 0 ? 0 : (seconds - start) / timing.duration,
        event: `${until.of}.${until.event}`,
      };
    } else if ("event" in until) {
      const event: IAutoMovieMotionEvent | undefined = timing.events?.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === until.event,
      );
      if (event === undefined)
        throw new AutoMovieScheduleError(
          `${intent.subject}.${intent.capability} has no event ${until.event}; its events are ${(timing.events ?? []).map((e: IAutoMovieMotionEvent): string => e.name).join(", ") || "none"}`,
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
        `Cut share of ${intent.subject}.${intent.capability} lies outside [0, 1]`,
        {
          ...who,
          code: "share",
          value: cut.share,
          ...("of" in until ? { of: until.of } : {}),
        },
      );
    return cut;
  }
}
