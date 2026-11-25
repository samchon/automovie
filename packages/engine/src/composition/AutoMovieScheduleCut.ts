import type {
  IAutoMovieIntent,
  IAutoMovieIntentTiming,
  IAutoMovieMotionEvent,
  IAutoMovieScheduleContext,
  IAutoMovieScheduleCue,
  IAutoMovieScheduleCut,
  IAutoMovieScheduleError,
  IAutoMovieScheduleWalk,
} from "@automovie/interface";

import { AutoMovieScheduleError } from "./AutoMovieScheduleError";
import { AutoMovieScheduleWalk } from "./AutoMovieScheduleWalk";

/**
 * Where an intent's `until` cuts it: a share of its duration, found from a
 * share, an event of its own timing, another anchor's or a cue track's event,
 * or the `until` law's proximity share.
 *
 * A proximity the law reports as never met leaves the intent uncut, so it runs
 * to its end; laws with no `until` at all cannot place a proximity cut and
 * throw.
 */
export namespace AutoMovieScheduleCut {
  /**
   * The cut of an intent.
   *
   * @param walk The walk.
   * @param intent The intent.
   * @param timing Its timing.
   * @param start Where it starts, film seconds.
   * @param context What the laws see while it is placed.
   * @returns The cut, or undefined when nothing cuts it.
   * @throws {AutoMovieScheduleError} When the law, the anchor, the event or the
   *   share is not valid.
   */
  export function of(
    walk: IAutoMovieScheduleWalk.IWalk,
    intent: IAutoMovieIntent,
    timing: IAutoMovieIntentTiming,
    start: number,
    context: IAutoMovieScheduleContext,
  ): IAutoMovieScheduleCut.ICut | undefined {
    const until: IAutoMovieIntent["until"] = intent.until;
    if (until === undefined) return undefined;
    const who: Pick<IAutoMovieScheduleError.IProps, "subject" | "capability"> =
      {
        subject: intent.subject,
        capability: intent.capability,
      };
    let cut: IAutoMovieScheduleCut.ICut | undefined;
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
      const events: readonly IAutoMovieScheduleCue[] | undefined =
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
