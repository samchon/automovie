import { resolveAutoMovieContactEvents } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A weapon that states the span it is live in is scanned over that span
 * alone, with the same result: a performance of strikes in sequence costs
 * in proportion to its strikes, where scanning every weapon over the whole
 * performance cost the square of them.
 *
 * The geometry is plain and solved by hand. Strike `k` of `n` is a sphere of
 * radius 0.05 m live from `k` to `k + 0.5` s, flying along x at 2 m/s from
 * x = -1 at its start; outside its span it is far away, as the performance
 * shows a weapon outside its window (here a megametre behind the wall). Odd strikes meet a wall at x = 0, so
 * they touch at `k + 0.475` s; even strikes are short of it (they stop at x
 * = -0.2) and meet nothing. The span runs from 0 to `n + 1` s at the
 * performance's step of 1/120 s. The wall's distance is counted, the cost a
 * performance pays as a posed body per call.
 *
 * Scenarios:
 * 1. For 8 and 16 strikes, the events with each weapon's span declared are
 *    the events without it, second for second: the odd strikes at `k +
 *    0.475` s to 1e-6 s, each against the wall.
 * 2. With spans declared, 16 strikes measure the wall at most 2.2 times as
 *    often as 8 (linear, with room for the events' re-scans).
 * 3. Without them, 16 strikes measure it more than 3 times as often as 8: the
 *    quadratic cost the spans remove, so scenario 2 tells the two apart.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public resolver with and without declared spans and reads its events and the bodies' measurements; a span that changes a result, or a scan that still covers the whole performance, fails.
 * @evidence contracts/development/testing.md#independent-expectations Contact seconds are solved by hand from straight paths; the growth bounds are those of a linear and a quadratic count, read from the counts, never from the resolver's code.
 * @evidence contracts/development/testing.md#distinguishing-cases Weapons that hit and weapons that miss, two sizes, with and without spans.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the geometry, the expected seconds, the bounds and the 3 scenarios.
 */
export function test_motion_contact_events_live_span(): void {
  const far: IAutoMovieVector3 = { x: -1e6, y: 0, z: 0 };
  const run = (
    n: number,
    spans: boolean,
  ): { events: resolveAutoMovieContactEvents.IEvent[]; calls: number } => {
    let calls: number = 0;
    const weapons: resolveAutoMovieContactEvents.IWeapon[] = [];
    for (let k: number = 1; k <= n; k++) {
      const reach: number = k % 2 === 1 ? 0.5 : -0.2;
      weapons.push({
        id: `w${String(k).padStart(3, "0")}`,
        owner: "S",
        radius: 0.05,
        ...(spans ? { from: k, to: k + 0.5 } : {}),
        position: (t: number): IAutoMovieVector3 =>
          t < k || t > k + 0.5
            ? far
            : { x: Math.min(reach, -1 + 2 * (t - k)), y: 0, z: 0 },
      });
    }
    const events: resolveAutoMovieContactEvents.IEvent[] =
      resolveAutoMovieContactEvents({
        weapons,
        bodies: [
          {
            id: "wall",
            distance: (p: IAutoMovieVector3): number => {
              calls++;
              return -p.x;
            },
          },
        ],
        from: 0,
        to: n + 1,
        step: 1 / 120,
      });
    return { events, calls };
  };

  // 1. The same events, by hand.
  const counts: Record<"live" | "whole", number[]> = { live: [], whole: [] };
  for (const n of [8, 16]) {
    const live = run(n, true);
    const whole = run(n, false);
    counts.live.push(live.calls);
    counts.whole.push(whole.calls);
    const expected: number[] = [];
    for (let k: number = 1; k <= n; k += 2) expected.push(k + 0.475);
    TestValidator.predicate(
      `${n} strikes: the odd ones meet the wall at k + 0.475 s, with or without spans`,
      [live.events, whole.events].every(
        (events: resolveAutoMovieContactEvents.IEvent[]): boolean =>
          events.length === expected.length &&
          events.every(
            (e: resolveAutoMovieContactEvents.IEvent, i: number): boolean =>
              e.against === "wall" &&
              Math.abs(e.seconds - expected[i]!) < 1e-6,
          ),
      ) &&
        live.events.every(
          (e: resolveAutoMovieContactEvents.IEvent, i: number): boolean =>
            e.seconds === whole.events[i]!.seconds &&
            e.weapon === whole.events[i]!.weapon,
        ),
    );
  }

  // 2 and 3. Linear with spans, quadratic without.
  const live: number = counts.live[1]! / counts.live[0]!;
  const whole: number = counts.whole[1]! / counts.whole[0]!;
  TestValidator.predicate(
    `with spans, 16 strikes measure ${live.toFixed(2)} times as often as 8 (${counts.live.join(" and ")} calls), 2.2 at most`,
    live <= 2.2,
  );
  TestValidator.predicate(
    `without spans, 16 strikes measure ${whole.toFixed(2)} times as often as 8 (${counts.whole.join(" and ")} calls), more than 3`,
    whole > 3,
  );
}
