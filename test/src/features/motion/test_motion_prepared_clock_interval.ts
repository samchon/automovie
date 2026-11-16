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
 *    An owned clock observes only the two actual name resolutions.
 * 2. Equal and reversed endpoints retain the original step at the closing
 *    second. A one-picosecond interval remains linear at its midpoint, while
 *    the adjacent shorter interval uses its stated step rule.
 * 3. A separate clock with identical names gives its own numeric interval,
 *    and a missing name refuses during preparation before any scalar query.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States action-local seconds, clamped shares and polynomial, fixed-name lifetime, inherited picosecond branch and three query/admission scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public Clock.prepare on actual owned named clocks, checks hand-derived uniform/progress values and boundary behavior, observes positive fixed-name reads without repeated resolution, and distinguishes another clock and missing-name refusal.
 * @evidence contracts/development/testing.md#independent-expectations Mapping [2,6] to [0,1] gives (t-2)/4 and Flash-Hogan's polynomial gives the expected progress. The existing strict1e-12-second short-window branch defines exact/reversed/adjacent cases, without changing the rule or relying on ordinary clock output as an oracle.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers before/inside/after intervals, out-of-order/repeated times, both smooth and degenerate spans, strict short-span boundary, separate same-named clocks and eager missing-name admission. Wider clock event/phase construction remains separately specified.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable unit owns clock callbacks and scalar inputs, invokes existing public preparation and starts no Human producer, host, renderer, compiler or foreign replacement.
 */
export function test_motion_prepared_clock_interval(): void {
  let reads: number = 0;
  const names: Readonly<Record<string, number>> = { open: 2, close: 6, zero: 4, short: 0.5e-12, boundary: 1e-12, start: 0 };
  const clock: Pick<C.IClock, "at"> = {
    at: (name: string): number => {
      reads++;
      const value: number | undefined = names[name];
      if (value === undefined) throw new Error(`Unknown owned instant ${name}`);
      return value;
    },
  };
  const prepared: ReturnType<typeof C.prepare> = C.prepare(clock, "open", "close");
  TestValidator.equals("preparation resolves its two actual fixed names", reads, 2);
  for (const seconds of [5, 1, 6, 3, 4, 8, 2, 3]) {
    const share: number = Math.min(1, Math.max(0, (seconds - 2) / 4));
    const progress: number = 10 * share ** 3 - 15 * share ** 4 + 6 * share ** 5;
    TestValidator.predicate("actual interval reads follow independent clock laws",
      nclose(prepared.linear(seconds), share, 0) && nclose(prepared.progress(seconds), progress, 1e-12),
    );
  }
  TestValidator.equals("scalar queries retain no dependency on repeated name reads", reads, 2);
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
    throwsError((): ReturnType<typeof C.prepare> => C.prepare(clock, "open", "missing"), "Unknown owned instant missing"),
  );
}
