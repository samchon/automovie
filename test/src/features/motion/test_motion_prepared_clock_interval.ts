import { AutoMovieMotionClock as C } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * Prepared action intervals resolve fixed names once and evaluate every
 * actual query second through the existing linear and minimum-jerk laws.
 *
 * Scenarios:
 * 1. The named [2,6] second interval has clamped shares0,1/4,1/2,3/4,1
 *    and progress10u^3-15u^4+6u^5, including backward and repeated reads.
 *    The actual native public clock preserves its fixed interval.
 * 2. Equal and reversed endpoints retain the original step at the closing
 *    second. A one-picosecond interval remains linear at its midpoint, while
 *    the adjacent shorter interval uses its stated step rule.
 * 3. A separate clock with identical names gives its own numeric interval,
 *    and a missing name refuses during preparation before any scalar query.
 * 4. A full owned custom clock retains actual receiver-bound linear/progress
 *    callbacks. Construction reads no custom instant; each current linear
 *    query needs exactly two lookups. Changing current named instants affects
 *    later reads, and a custom missing name refuses at its own actual query.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States action-local seconds, clamped shares and polynomial, native fixed-name lifetime versus current custom callbacks, inherited picosecond branch and four query/admission scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public Clock.prepare on native Clock.of and full owned custom clocks, checks hand-derived uniform/progress values and boundaries, and observes required current custom callbacks/two instant lookups, receiver ownership, changing instants and the native/custom distinction in missing-name admission.
 * @evidence contracts/development/testing.md#independent-expectations Mapping [2,6] to [0,1] gives (t-2)/4 and Flash-Hogan's polynomial gives the expected progress. The existing strict1e-12-second short-window branch defines exact/reversed/adjacent cases, without changing the rule or relying on ordinary clock output as an oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers native before/inside/after intervals, out-of-order/repeated times, smooth/degenerate spans, strict short-span boundary, separate same-named clocks and eager missing-name admission; custom callbacks retain receiver/effects/current names and defer their own refusal until queried. Native private lookup counts are deliberately not inferred through a wrapper that invalidates native identity; required custom lookups remain directly asserted.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable unit owns clock callbacks and scalar inputs, invokes existing public preparation and starts no Human producer, host, renderer, compiler or foreign replacement.
 */
export function test_motion_prepared_clock_interval(): void {
  const clock: C.IClock = C.of(8, [
    { name: "open", seconds: 2 }, { name: "close", seconds: 6 }, { name: "zero", seconds: 4 },
    { name: "short", seconds: 0.5e-12 }, { name: "boundary", seconds: 1e-12 },
  ]);
  const prepared: ReturnType<typeof C.prepare> = C.prepare(clock, "open", "close");
  for (const seconds of [5, 1, 6, 3, 4, 8, 2, 3]) {
    const share: number = Math.min(1, Math.max(0, (seconds - 2) / 4));
    const progress: number = 10 * share ** 3 - 15 * share ** 4 + 6 * share ** 5;
    TestValidator.predicate("actual interval reads follow independent clock laws",
      nclose(prepared.linear(seconds), share, 0) && nclose(prepared.progress(seconds), progress, 1e-12),
    );
  }
  for (const [from, to, before, at] of [
    ["zero", "zero", 3.99, 4], ["close", "open", 1.99, 2], ["start", "short", 0.25e-12, 0.5e-12],
  ] as const) {
    const step: ReturnType<typeof C.prepare> = C.prepare(clock, from, to);
    TestValidator.predicate("equal reversed and short spans keep their exact closing step",
      nclose(step.linear(before), 0, 0) && nclose(step.progress(before), 0, 0) &&
      nclose(step.linear(at), 1, 0) && nclose(step.progress(at), 1, 0),
    );
  }
  const boundary: ReturnType<typeof C.prepare> = C.prepare(clock, "start", "boundary");
  TestValidator.predicate("exact picosecond boundary stays in the linear branch",
    nclose(boundary.linear(0.5e-12), 0.5, 0) && nclose(boundary.progress(0.5e-12), 0.5, 1e-12),
  );
  const other: ReturnType<typeof C.prepare> = C.prepare(C.of(8, [
    { name: "open", seconds: 4 }, { name: "close", seconds: 8 },
  ]), "open", "close");
  TestValidator.predicate("same names on another clock keep their own interval",
    nclose(prepared.linear(4), 0.5, 0) && nclose(other.linear(4), 0, 0),
  );
  TestValidator.predicate("unknown instant refuses before a query can use the interval",
    throwsError((): ReturnType<typeof C.prepare> => C.prepare(clock, "open", "missing"), "missing"),
  );

  let reads: number = 0;
  let lines: number = 0;
  let progresses: number = 0;
  let offset: number = 0;
  const custom: C.IClock = {
    duration: 8,
    get instants(): readonly C.IInstant[] {
      return [{ name: "open", seconds: 2 + offset }, { name: "close", seconds: 6 + offset }];
    },
    at: (name: string): number => {
      reads++;
      if (name === "open") return 2 + offset;
      if (name === "close") return 6 + offset;
      if (name === "start") return 0;
      if (name === "end") return 8;
      throw new Error(`Unknown owned instant ${name}`);
    },
    linear(this: C.IClock, from: string, to: string, seconds: number): number {
      lines++;
      TestValidator.predicate("custom linear keeps its actual receiver", this === custom);
      const a: number = this.at(from);
      const b: number = this.at(to);
      return b - a < 1e-12 ? (seconds >= b ? 1 : 0) : Math.min(1, Math.max(0, (seconds - a) / (b - a)));
    },
    progress(this: C.IClock, from: string, to: string, seconds: number): number {
      progresses++;
      TestValidator.predicate("custom progress keeps its actual receiver", this === custom);
      const u: number = this.linear(from, to, seconds);
      return 10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5;
    },
    envelope(this: C.IClock, rise: readonly [string, string], fall: readonly [string, string], seconds: number): number {
      return Math.max(0, this.progress(rise[0], rise[1], seconds) - this.progress(fall[0], fall[1], seconds));
    },
    events(this: C.IClock): ReturnType<C.IClock["events"]> {
      return this.instants.map((instant: C.IInstant): ReturnType<C.IClock["events"]>[number] =>
        ({ name: instant.name, share: instant.seconds / this.duration }));
    },
  };
  const live: ReturnType<typeof C.prepare> = C.prepare(custom, "open", "close");
  TestValidator.predicate("custom preparation does not execute inactive callbacks",
    reads === 0 && lines === 0 && progresses === 0,
  );
  TestValidator.predicate("one actual custom linear query retains exactly two required name lookups",
    nclose(live.linear(3), 0.25, 0) && reads === 2 && lines === 1 && progresses === 0,
  );
  offset = 1;
  TestValidator.predicate("custom progress reads its current interval and actual linear dependency",
    nclose(live.progress(3), 0, 0) && reads === 4 && lines === 2 && progresses === 1,
  );
  TestValidator.predicate("another current second cannot receive an earlier custom answer",
    nclose(live.linear(5), 0.5, 0) && reads === 6 && lines === 3,
  );
  const missing: ReturnType<typeof C.prepare> = C.prepare(custom, "open", "missing");
  TestValidator.predicate("custom missing-name refusal remains at its original actual callback",
    throwsError((): number => missing.linear(0), "Unknown owned instant missing"),
  );
}
