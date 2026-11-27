import {
  type IAutoMovieEvaluateStorySync,
  IAutoMovieShotStoryTime,
  IAutoMovieStorySyncOutcome,
  IAutoMovieStorySyncPoint,
} from "@automovie/interface";

import { overflowsBinary64 } from "../../math/internal/overflowsBinary64";

/*
 * Measure one cross-shot simultaneity claim on the production story clock.
 *
 * Each addressed event is taken at its realized shot-local time, mapped through
 * its own shot's pin by autoMovieStoryTime, and the widest gap between
 * any two resulting story times is compared against the tolerance, inclusive.
 * Nothing here consults the edit: two shots cut minutes apart pass when their
 * pins put the events together, and two adjacent shots fail when their pins do
 * not.
 *
 * The verdict is refusable. An unpinned shot, a missing or non-finite
 * realization, or a story time that is not finite leaves an operand unresolved,
 * and the claim then fails with a summary naming the first such operand and
 * why, because a claim nobody can measure is not a claim that holds. An empty
 * event list fails too. Otherwise the summary names the earliest and latest
 * events, where a tie for latest names the later-listed event so a simultaneous
 * claim quotes two distinct events. Every point is reported in declared order
 * either way.
 */
export function evaluateAutoMovieStorySync(
  props: IAutoMovieEvaluateStorySync.IProps,
): IAutoMovieStorySyncOutcome {
  const entries: IStorySyncEntry[] = props.events.map(
    (entry: { shot: string; event: string }): IStorySyncEntry => {
      const realized: number | null = props.realized(entry.shot, entry.event);
      const localSeconds: number | null = realized === null ? null : realized;
      const pin: IAutoMovieShotStoryTime | null = props.pin(entry.shot);
      const storySeconds: number | null =
        localSeconds === null || pin === null
          ? null
          : pinned(pin, localSeconds);
      return {
        point: {
          shot: entry.shot,
          event: entry.event,
          localSeconds,
          storySeconds,
        },
        reason:
          storySeconds !== null
            ? null
            : localSeconds === null
              ? "that shot has no compiled realization for it"
              : pin === null
                ? "that shot is not pinned to the production story clock"
                : "its pinned story time is not a finite number",
      };
    },
  );
  const points: IAutoMovieStorySyncPoint[] = entries.map(
    (entry: IStorySyncEntry): IAutoMovieStorySyncPoint => entry.point,
  );
  const unresolved: IStorySyncEntry | undefined = entries.find(
    (entry: IStorySyncEntry): boolean => entry.reason !== null,
  );
  if (unresolved !== undefined)
    return {
      points,
      spreadSeconds: null,
      toleranceSeconds: props.toleranceSeconds,
      passed: false,
      summary: `event "${unresolved.point.event}" of shot "${unresolved.point.shot}" has no story time: ${unresolved.reason}.`,
    };
  const first: IAutoMovieStorySyncPoint | undefined = points[0];
  if (first === undefined)
    return {
      points,
      spreadSeconds: null,
      toleranceSeconds: props.toleranceSeconds,
      passed: false,
      summary:
        "no event was addressed, so there is no moment to compare on the story clock.",
    };
  // Every point has a story time here: an unresolved one returned above.
  let earliest: IAutoMovieStorySyncPoint = first;
  let latest: IAutoMovieStorySyncPoint = first;
  for (const point of points) {
    if (point.storySeconds! < earliest.storySeconds!) earliest = point;
    if (point.storySeconds! >= latest.storySeconds!) latest = point;
  }
  const spreadSeconds: number = latest.storySeconds! - earliest.storySeconds!;
  const passed: boolean = spreadSeconds <= props.toleranceSeconds;
  return {
    points,
    spreadSeconds,
    toleranceSeconds: props.toleranceSeconds,
    passed,
    summary: `event "${earliest.event}" of shot "${earliest.shot}" at story ${earliest.storySeconds}s and event "${latest.event}" of shot "${latest.shot}" at story ${latest.storySeconds}s are ${spreadSeconds}s apart, ${
      passed ? "within" : "beyond"
    } the ${props.toleranceSeconds}s tolerance.`,
  };
}

/*
 * One addressed event's measurement, with why it has no story time.
 */
interface IStorySyncEntry {
  /*
   * The event as reported in the outcome.
   */
  point: IAutoMovieStorySyncPoint;

  /*
   * Why the event has no story time, or null when it has one.
   */
  reason: string | null;
}

/*
 * The story second of a local second under a pin, or null where its product or
 * sum overflows binary64.
 */
function pinned(
  pin: IAutoMovieShotStoryTime,
  localSeconds: number,
): number | null {
  const scaled: number = localSeconds * (pin.rate ?? 1);
  if (overflowsBinary64(scaled)) return null;
  const story: number = pin.originSeconds + scaled;
  return overflowsBinary64(story) ? null : story;
}
