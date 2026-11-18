import { advanceAutoMovieGrid } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * A check that reads a margin and bounds how fast its value can move skips
 * the grid instants the margin certifies (`advanceAutoMovieGrid`), and finds
 * the first violation a scan of every instant finds, at the same instant.
 *
 * The value is solved by hand: v(t) = 0.5 sin(2 pi t) over 0 to 2 s on a
 * 1/120 s grid, whose speed never exceeds pi per second (the derivative's
 * amplitude), so pi times the elapsed time bounds how far it moves. A limit
 * of 0.45 is first passed where sin(2 pi t) > 0.9, after
 * asin(0.9) / (2 pi) = 0.1782 s: the instant 22 / 120 s. A limit of 0.6 is
 * never passed.
 *
 * Scenarios:
 * 1. With the limit 0.45, the certified scan stops at the instant the full
 *    scan stops at, 22, from fewer reads than its 23.
 * 2. With the limit 0.6, neither scan finds a violation, and the certified
 *    one reads under a third of the 241 instants.
 * 3. A bound stated only up to 1 s certifies nothing past it: no violation,
 *    and every instant past 1 s is read.
 * 4. A bound equal to the margin does not certify: with 0.25 a step and a
 *    margin of 1, the fourth instant is the first not certified.
 * 5. A margin of zero, or a read at the grid's last instant, certifies
 *    nothing beyond the next instant.
 * 6. Over a stretch of 1,000 certified instants the bound is read at most
 *    2 ceil(log2 1000) + 2 = 22 times.
 * 7. A negative bound is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Runs a full scan and a certified scan over the same value and compares the first violation and the reads; an advancement that skips an uncertified instant, stops late or reads every instant fails.
 * @evidence contracts/development/testing.md#independent-expectations The violating instant and the speed bound are solved by hand from the sine; the read bound from the gallop's doubling.
 * @evidence contracts/development/testing.md#distinguishing-cases A violation, none, a bound that ends, a bound equal to the margin, a zero margin, the grid's end, a long certified stretch and a refused bound.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the value, its bound, the expected instants and the 7 scenarios.
 */
export function test_motion_grid_advancement(): void {
  const step: number = 1 / 120;
  const end: number = 240;
  const value = (k: number): number => 0.5 * Math.sin(2 * Math.PI * k * step);
  const full = (limit: number): number | undefined => {
    for (let k: number = 0; k <= end; k++) if (value(k) > limit) return k;
    return undefined;
  };
  const certified = (
    limit: number,
    until: number = Infinity,
  ): { first: number | undefined; reads: number[] } => {
    const reads: number[] = [];
    for (let k: number = 0; k <= end; ) {
      reads.push(k);
      const v: number = value(k);
      if (v > limit) return { first: k, reads };
      k = advanceAutoMovieGrid(k, end, limit - v, (a: number, b: number) =>
        b * step > until ? undefined : Math.PI * (b - a) * step,
      );
    }
    return { first: undefined, reads };
  };

  // 1. The same first violation, from fewer reads.
  const hit = certified(0.45);
  TestValidator.predicate(
    `the limit 0.45 is first passed at 22 by both scans (full ${full(0.45)}, certified ${hit.first}) from ${hit.reads.length} reads`,
    full(0.45) === 22 && hit.first === 22 && hit.reads.length < 23,
  );

  // 2. No violation, from a third of the reads.
  const clear = certified(0.6);
  TestValidator.predicate(
    `the limit 0.6 is never passed and ${clear.reads.length} of 241 instants are read`,
    full(0.6) === undefined &&
      clear.first === undefined &&
      clear.reads.length * 3 < 241,
  );

  // 3. A bound that ends certifies nothing past its end.
  const ended = certified(0.6, 1);
  TestValidator.predicate(
    "a bound stated to 1 s leaves every instant past it read",
    ended.first === undefined &&
      Array.from(
        { length: 120 },
        (_: unknown, i: number): number => 121 + i,
      ).every((k: number): boolean => ended.reads.includes(k)),
  );

  // 4. A bound equal to the margin does not certify.
  TestValidator.equals(
    "a step of 0.25 against a margin of 1 stops at the fourth instant",
    advanceAutoMovieGrid(
      0,
      100,
      1,
      (a: number, b: number): number => 0.25 * (b - a),
    ),
    4,
  );

  // 5. Nothing is certified by a zero margin or from the last instant.
  TestValidator.predicate(
    "a zero margin and the last instant certify nothing",
    advanceAutoMovieGrid(5, 100, 0, (): number => 0) === 6 &&
      advanceAutoMovieGrid(100, 100, 1, (): number => 0) === 101,
  );

  // 6. The bound is read a logarithmic number of times.
  let asked: number = 0;
  const far: number = advanceAutoMovieGrid(
    0,
    2000,
    1,
    (a: number, b: number): number => {
      ++asked;
      return b <= 1000 ? 0 : 2;
    },
  );
  TestValidator.predicate(
    `1,000 certified instants end at 1001 (${far}) from ${asked} bound reads, at most 22`,
    far === 1001 && asked <= 22,
  );

  // 7. A negative bound is refused.
  TestValidator.error("a negative bound is refused", (): number =>
    advanceAutoMovieGrid(0, 10, 1, (): number => -1),
  );
}
