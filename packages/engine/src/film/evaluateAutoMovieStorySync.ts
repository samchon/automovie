import {
  IAutoMovieShotStoryTime,
  IAutoMovieStorySyncOutcome,
  IAutoMovieStorySyncPoint,
} from "@automovie/interface";

import { autoMovieStoryTime } from "./autoMovieStoryTime";

/** One addressed event's measurement, with why it has no story time. */
interface IStorySyncEntry {
  /** The event as reported in the outcome. */
  point: IAutoMovieStorySyncPoint;

  /** Why the event has no story time, or null when it has one. */
  reason: string | null;
}

/**
 * Measure one cross-shot simultaneity claim on the production story clock.
 *
 * Each addressed event is taken at its realized shot-local time, mapped through
 * its own shot's pin by {@link autoMovieStoryTime}, and the widest gap between
 * any two resulting story times is compared against the tolerance, inclusive.
 * Nothing here consults the edit: two shots cut minutes apart pass when their
 * pins put the events together, and two adjacent shots fail when their pins do
 * not.
 *
 * The verdict is refusable. An unpinned shot, a missing or non-finite
 * realization, or a story time that is not finite leaves an operand
 * unresolved, and the claim then fails with a summary naming the first such
 * operand and why, because a claim nobody can measure is not a claim that
 * holds. An empty event list fails too. Otherwise the summary names the
 * earliest and latest events, where a tie for latest names the later-listed
 * event so a simultaneous claim quotes two distinct events. Every point is
 * reported in declared order either way.
 *
 * @evidence contracts/common.md#principled-implementation Maps every realized time through its shot's pin, then takes the range of the story times in one pass, since the largest pairwise gap of a set of reals is its maximum minus its minimum; unresolved operands fail before any comparison so a missing measurement can never pass.
 * @evidence contracts/common.md#clear-and-simple-design Owns the measurement and verdict only; the story map is `autoMovieStoryTime` and the lookups of pins and realized times are callbacks, so `storySyncDiagnostics` binds them to the production's contracts and realizations without this function knowing their stores.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no shot or event; the tolerance is the caller's, unresolved operands fail rather than being skipped, and the tie rule only selects which events the summary quotes.
 * @evidence contracts/common.md#meaningful-documentation States the mapping, the inclusive comparison, the independence from the edit, every refusal case and its summary, the empty-list result, the tie rule, and the order of the reported points.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the addressed events, one callback pair per event and one pass for the extremes, instead of comparing every pair.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Evaluates one claim from its callbacks; `storySyncDiagnostics` routes every consumer through one call per claim and owns any reuse of realizations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the caller owns the outcome and its one point per addressed event.
 */
export function evaluateAutoMovieStorySync (props: {
  /** Addressed shot-and-event pairs in their declared order. */
  events: ReadonlyArray<{ shot: string; event: string }>;

  /** Finite non-negative tolerance in story seconds; the caller validates it. */
  toleranceSeconds: number;

  /** Story-clock pin of one shot, or null when that shot carries none. */
  pin: (shot: string) => IAutoMovieShotStoryTime | null;

  /** Realized shot-local event time in seconds, or null when unavailable. */
  realized: (shot: string, event: string) => number | null;
}): IAutoMovieStorySyncOutcome {
  const entries: IStorySyncEntry[] = props.events.map(
    (entry: { shot: string; event: string }): IStorySyncEntry => {
      const realized: number | null = props.realized(entry.shot, entry.event);
      const localSeconds: number | null =
        realized === null || Number.isFinite(realized) === false
          ? null
          : realized;
      const pin: IAutoMovieShotStoryTime | null = props.pin(entry.shot);
      const mapped: number | null =
        localSeconds === null || pin === null
          ? null
          : autoMovieStoryTime(pin, localSeconds);
      const storySeconds: number | null =
        mapped === null || Number.isFinite(mapped) === false ? null : mapped;
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
