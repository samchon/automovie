import {
  autoMovieStoryInterval,
  autoMovieStoryTime,
  evaluateAutoMovieStorySync,
} from "@automovie/engine";
import type {
  IAutoMovieShotStoryTime,
  IAutoMovieStorySyncPoint,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose } from "../internal/predicates";

/**
 * Three coverages of one moment, pinned so the arithmetic is exact.
 *
 * `cover-a` opens at story second 30 and realizes its event 2.5s in; `cover-b`
 * opens at 28.5 and realizes 4s in. Both land on story second 32.5 from
 * different local times, which is the whole point: local time says where you
 * are inside a shot, story time says when the shot happened. `cover-c` opens at
 * 27 and realizes 4s in, landing on 31 — a story-clock second and a half away
 * from the other two however the edit orders them.
 */
const PINS: Readonly<Record<string, IAutoMovieShotStoryTime>> = {
  "cover-a": { originSeconds: 30 },
  "cover-b": { originSeconds: 28.5 },
  "cover-c": { originSeconds: 27 },
};

/** Authored shot-local event seconds, kept separate from the story pin table. */
const REALIZED: Readonly<Record<string, number>> = {
  "cover-a mark-a": 2.5,
  "cover-b mark-b": 4,
  "cover-c mark-c": 4,
};

/** Evaluate the supplied events with the authored pin/realization tables or explicit refusal overrides; the owning entry derives expected story seconds and messages from these inputs. */
const sync: (
  events: ReadonlyArray<{ shot: string; event: string }>,
  toleranceSeconds: number,
  overrides?: {
    pin?: (shot: string) => IAutoMovieShotStoryTime | null;
    realized?: (shot: string, event: string) => number | null;
  },
) => ReturnType<typeof evaluateAutoMovieStorySync> = (
  events: ReadonlyArray<{ shot: string; event: string }>,
  toleranceSeconds: number,
  overrides: {
    pin?: (shot: string) => IAutoMovieShotStoryTime | null;
    realized?: (shot: string, event: string) => number | null;
  } = {},
): ReturnType<typeof evaluateAutoMovieStorySync> =>
  evaluateAutoMovieStorySync({
    events,
    toleranceSeconds,
    pin:
      overrides.pin ??
      ((shot: string): IAutoMovieShotStoryTime | null => PINS[shot] ?? null),
    realized:
      overrides.realized ??
      ((shot: string, event: string): number | null =>
        REALIZED[`${shot} ${event}`] ?? null),
  });

/**
 * The production story clock: what the film asserts happened, as opposed to the
 * order it shows things in.
 *
 * Scenarios:
 *
 * 1. A pin maps shot-local seconds onto the clock, honouring an explicit rate, and
 *    maps a shot-local window, the whole shot or an event window inside it, onto
 *    the story interval it occupies.
 * 2. Two shots pinned to the same story moment are judged simultaneous from
 *    different local times, and the verdict names both events.
 * 3. Two shots that are not are judged apart, and the failure names the gap it
 *    measured and the tolerance it exceeded.
 * 4. The tolerance is inclusive, so a claim exactly as wide as it holds.
 * 5. An unmeasurable operand — no pin, no realization, a non-finite sample, an
 *    overflowed story time — refuses the claim and names which operand it was,
 *    and an empty claim is refused because it addresses no event.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises affine story point/interval mapping and story-sync pin comparisons, observing satisfied inclusive tolerance, mismatch, unresolved reasons and empty-pin refusal.
 * @evidence contracts/testing.md#independent-expectations Authored offsets/rates, literal mapped seconds and story pin residuals provide the independent arithmetic oracle; comparison boundaries are selected around the stated tolerance rather than copied output.
 * @evidence contracts/testing.md#distinguishing-cases Preserves default and half-speed rate, whole/event interval mapping, equal and apart story moments, inclusive tolerance, missing pin/realization, NaN realization, overflowing mapped time and empty input; negative/zero rates and shot/narration compilation are not established by these cases.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit owns these portable clock and callback cases through engine functions, without an audio decoder, process, GPU or real-time clock host.
 */
export function test_film_story_clock(): void {
  const defaultTime: number = autoMovieStoryTime({ originSeconds: 10 }, 4);
  const explicitTime: number = autoMovieStoryTime(
    { originSeconds: 10, rate: 0.5 },
    4,
  );
  const pin: IAutoMovieShotStoryTime = { originSeconds: 10, rate: 0.5 };
  const whole: ReturnType<typeof autoMovieStoryInterval> =
    autoMovieStoryInterval(pin, { from: 0, to: 6 });
  const event: ReturnType<typeof autoMovieStoryInterval> =
    autoMovieStoryInterval(pin, { from: 2, to: 6 });
  TestValidator.predicate(
    "a pin maps shot-local time onto the story clock",
    (): boolean =>
      defaultTime === 14 &&
      nclose(defaultTime, 14, 0) &&
      explicitTime === 12 &&
      nclose(explicitTime, 12, 0) &&
      whole.from === 10 &&
      nclose(whole.from, 10, 0) &&
      whole.to === 13 &&
      nclose(whole.to, 13, 0) &&
      event.from === 11 &&
      nclose(event.from, 11, 0) &&
      event.to === 13 &&
      nclose(event.to, 13, 0),
  );

  const together: ReturnType<typeof sync> = sync(
    [
      { shot: "cover-a", event: "mark-a" },
      { shot: "cover-b", event: "mark-b" },
    ],
    0.25,
  );
  TestValidator.predicate(
    "simultaneous pins retain their exact authored seconds",
    (): boolean =>
      together.spreadSeconds === 0 &&
      nclose(together.spreadSeconds, 0, 0) &&
      together.points.every(
        (point: IAutoMovieStorySyncPoint): boolean =>
          point.storySeconds === 32.5 && nclose(point.storySeconds, 32.5, 0),
      ) &&
      together.points[0]?.localSeconds === 2.5 &&
      nclose(together.points[0].localSeconds, 2.5, 0) &&
      together.points[1]?.localSeconds === 4 &&
      nclose(together.points[1].localSeconds, 4, 0),
  );
  TestValidator.equals(
    "two shots pinned to the same story moment are judged simultaneous",
    namedFacts([
      ["passed", (): boolean => together.passed],
      [
        "summaryNamesBothEvents",
        (): boolean =>
          together.summary.includes('"mark-a" of shot "cover-a"') &&
          together.summary.includes('"mark-b" of shot "cover-b"'),
      ],
      [
        "summaryStatesTolerance",
        (): boolean => together.summary.includes("within the 0.25s tolerance"),
      ],
    ]),
    {
      passed: true,
      summaryNamesBothEvents: true,
      summaryStatesTolerance: true,
    },
  );

  const apart: ReturnType<typeof sync> = sync(
    [
      { shot: "cover-a", event: "mark-a" },
      { shot: "cover-c", event: "mark-c" },
    ],
    0.25,
  );
  TestValidator.predicate(
    "the measured gap is exactly one and a half seconds",
    (): boolean =>
      apart.spreadSeconds === 1.5 && nclose(apart.spreadSeconds, 1.5, 0),
  );
  TestValidator.equals(
    "a false simultaneity claim is refused and names the measured gap",
    namedFacts([
      ["refused", (): boolean => apart.passed === false],
      [
        "summaryNamesGap",
        (): boolean => apart.summary.includes("are 1.5s apart"),
      ],
      [
        "summaryStatesTolerance",
        (): boolean => apart.summary.includes("beyond the 0.25s tolerance"),
      ],
      [
        "summaryOrdersByStoryTime",
        (): boolean =>
          apart.summary.startsWith(
            'event "mark-c" of shot "cover-c" at story 31s and event "mark-a" of shot "cover-a" at story 32.5s',
          ),
      ],
    ]),
    {
      refused: true,
      summaryNamesGap: true,
      summaryStatesTolerance: true,
      summaryOrdersByStoryTime: true,
    },
  );

  TestValidator.predicate(
    "a gap exactly as wide as the tolerance still holds",
    sync(
      [
        { shot: "cover-a", event: "mark-a" },
        { shot: "cover-c", event: "mark-c" },
      ],
      1.5,
    ).passed,
  );

  const unpinned: ReturnType<typeof sync> = sync(
    [
      { shot: "cover-a", event: "mark-a" },
      { shot: "cover-x", event: "mark-x" },
    ],
    5,
    { realized: (): number | null => 1.5 },
  );
  const unrealized: ReturnType<typeof sync> = sync(
    [
      { shot: "cover-a", event: "mark-a" },
      { shot: "cover-b", event: "mark-b" },
    ],
    5,
    {
      realized: (shot: string): number | null =>
        shot === "cover-a" ? 2.5 : null,
    },
  );
  const unsampled: ReturnType<typeof sync> = sync(
    [{ shot: "cover-a", event: "mark-a" }],
    5,
    {
      realized: (): number | null => Number.NaN,
    },
  );
  const overflowed: ReturnType<typeof sync> = sync(
    [{ shot: "cover-a", event: "mark-a" }],
    5,
    {
      pin: (): IAutoMovieShotStoryTime | null => ({
        originSeconds: 1e308,
        rate: 10,
      }),
      realized: (): number | null => 1e307,
    },
  );
  const empty: ReturnType<typeof sync> = sync([], 5);
  TestValidator.predicate(
    "an unresolved sibling preserves the resolved story second",
    (): boolean =>
      unpinned.points[0]?.storySeconds === 31.5 &&
      nclose(unpinned.points[0].storySeconds, 31.5, 0),
  );
  TestValidator.equals(
    "an unmeasurable operand refuses the claim and names itself",
    namedFacts([
      ["unpinnedRefused", (): boolean => unpinned.passed === false],
      ["unpinnedSpread", (): boolean => unpinned.spreadSeconds === null],
      [
        "unpinnedNamesReason",
        (): boolean =>
          unpinned.summary ===
          'event "mark-x" of shot "cover-x" has no story time: that shot is not pinned to the production story clock.',
      ],
      ["unrealizedRefused", (): boolean => unrealized.passed === false],
      [
        "unrealizedNamesReason",
        (): boolean =>
          unrealized.summary ===
          'event "mark-b" of shot "cover-b" has no story time: that shot has no compiled realization for it.',
      ],
      [
        "unrealizedKeepsNullLocal",
        (): boolean => unrealized.points[1]?.localSeconds === null,
      ],
      ["unsampledRefused", (): boolean => unsampled.passed === false],
      [
        "unsampledIsNotARealization",
        (): boolean => unsampled.summary.includes("no compiled realization"),
      ],
      ["overflowedRefused", (): boolean => overflowed.passed === false],
      [
        "overflowedNamesReason",
        (): boolean =>
          overflowed.summary.includes("is not a finite number") &&
          overflowed.points[0]?.storySeconds === null,
      ],
      ["emptyRefused", (): boolean => empty.passed === false],
      ["emptyPoints", (): boolean => empty.points.length === 0],
      [
        "emptyNamesReason",
        (): boolean => empty.summary.includes("no event was addressed"),
      ],
    ]),
    {
      unpinnedRefused: true,
      unpinnedSpread: true,
      unpinnedNamesReason: true,
      unrealizedRefused: true,
      unrealizedNamesReason: true,
      unrealizedKeepsNullLocal: true,
      unsampledRefused: true,
      unsampledIsNotARealization: true,
      overflowedRefused: true,
      overflowedNamesReason: true,
      emptyRefused: true,
      emptyPoints: true,
      emptyNamesReason: true,
    },
  );
}
