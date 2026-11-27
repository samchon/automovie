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

import { AutoMovieScheduleError } from "../../AutoMovieScheduleError";
import { AutoMovieScheduleWalk } from "../../AutoMovieScheduleWalk";
import { normalizeAutoMovieScheduleCut } from "./normalizeAutoMovieScheduleCut";
/*
 * Resolve an intent's cut.
 * Parameter walk: The walk.
 * Parameter intent: The intent.
 * Parameter timing: Its timing.
 * Parameter start: Where it starts, film seconds.
 * Parameter context: What the laws see while it is placed.
 * Returns: The cut, or undefined when nothing cuts it.
 * When the law, anchor, event or share is
 * invalid.
 * When its cut is malformed or ambiguous.
 */
export function resolveAutoMovieScheduleCut(
  walk: IAutoMovieScheduleWalk.IWalk,
  intent: IAutoMovieIntent,
  timing: IAutoMovieIntentTiming,
  start: number,
  context: IAutoMovieScheduleContext,
): IAutoMovieScheduleCut.ICut | undefined {
  if (intent.until === undefined) return undefined;
  const until: IAutoMovieIntent.IUntil = normalizeAutoMovieScheduleCut(intent.until);
  const who: Pick<IAutoMovieScheduleError.IProps, "subject" | "capability"> =
    {
      subject: intent.subject,
      capability: intent.capability,
    };
  let cut: IAutoMovieScheduleCut.ICut | undefined;
  switch (until.type) {
    case "proximity": {
      if (walk.laws.until === undefined)
        throw new AutoMovieScheduleError(
          `${intent.subject}.${intent.capability} cuts on proximity, which these laws cannot resolve`,
          { ...who, code: "law", value: "until" },
        );
      const share: number | undefined = walk.laws.until(
        until === intent.until ? intent : { ...intent, until },
        { start, duration: timing.duration },
        context,
      );
      if (share !== undefined) cut = { share };
      break;
    }
    case "anchor-event": {
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
        share:
          timing.duration === 0 ? 0 : (seconds - start) / timing.duration,
        event: `${until.of}.${until.event}`,
      };
      break;
    }
    case "event": {
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
      break;
    }
    case "share":
      cut = { share: until.share };
      break;
  }
  if (cut !== undefined && !(cut.share >= 0 && cut.share <= 1))
    throw new AutoMovieScheduleError(
      `Cut share of ${intent.subject}.${intent.capability} lies outside [0, 1]`,
      {
        ...who,
        code: "share",
        value: cut.share,
        ...(until.type === "anchor-event" ? { of: until.of } : {}),
      },
    );
  return cut;
}
