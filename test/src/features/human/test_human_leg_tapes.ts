import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanLegTapes as T } from "../../../../packages/human/src/generation/AutoMovieHumanLegTapes";
import { AutoMovieHumanTapeProfile as P } from "../../../../packages/human/src/generation/AutoMovieHumanTapeProfile";
import { nclose } from "../internal/nclose";

/**
 * Horizontal leg tapes read the assembled surface and close its own size.
 *
 * Scenarios:
 * 1. Straight round tubes preserve the known circumference at interior cuts.
 * 2. A tilted circular tube has the independent horizontal ellipse perimeter.
 * 3. A normal-plane circle sized as a horizontal tape is red; closure is green.
 * 4. Monotone positive keys keep one calf belly and no intermediate extrema.
 * 5. Missing cuts return null and unequal phase counts are rejected.
 * 6. Corner growth leaves the shared root with zero slope and curvature.
 * 7. A larger bony knee stays outside a complete muscle-region maximum.
 *
 * @evidence contracts/testing.md#behavioral-verification Intersects analytic triangulated tubes through the production horizontal cutter and closes a tilted tube through the production solver. The initial normal-plane circle demonstrably misses its horizontal target, and the corrected surface answers it. The profile checks prohibit extra extrema between specified tapes. A corner's old quadratic opening fails zero root curvature while the corrected opening preserves it and advances monotonically.
 * @evidence contracts/testing.md#independent-expectations Circle circumference is 2 pi r; a straight tilted circular cylinder has horizontal ellipse semiaxes r/cos(angle) and r. The ellipse perimeter comes from an independent 16384-point midpoint integration. The 0.02 mm polygon allowance exceeds the 256-gon circle deficit of 0.0032 mm and corresponding tilted bound. Closure is required within its declared 0.01 mm residual rather than a looser anatomy tolerance. A shared constant endpoint requires zero second derivative; its one-sided finite difference uses a relative step of 1e-4 and a 1e-6/length allowance, above its second-order truncation error.
 * @evidence contracts/testing.md#distinguishing-cases Covers zero and nonzero tilt, absent exterior planes, malformed adjacent phases, a deliberately wrong measurement plane, and increasing, decreasing and held positive profile intervals. Whole generated people, semantic clinical addresses and the assembled hip boundary remain with anatomy and curve checks.
 * @evidence contracts/testing.md#execution-ownership A synchronous discoverable CPU test selected by --include human_leg_tapes. It allocates local analytic rings and invokes source helpers without a generator, process, browser or GPU.
 */
export function test_human_leg_tapes(): void {
  for (const angle of [0, Math.PI / 6]) {
    const rings: T.IRing[] = tube(20, angle);
    const reading: T.IReading | null = T.horizontal(rings, 150.123);
    TestValidator.predicate("tube cut exists", reading !== null);
    TestValidator.predicate("horizontal ellipse", reading !== null && nclose(reading.girth, ellipse(20 / Math.cos(angle), 20), 0.02));
    TestValidator.predicate("outside cut absent", T.horizontal(rings, 500) === null);
  }

  let radius: number = 20;
  const target: number = 40 * Math.PI;
  const surface: () => T.IRing[] = (): T.IRing[] => tube(radius, Math.PI / 6);
  const read: (rings: readonly T.IRing[]) => number = (rings: readonly T.IRing[]): number => T.horizontal(rings, 150.123)!.girth;
  TestValidator.predicate("wrong normal-plane sizing is red", Math.abs(read(surface()) - target) > 9);
  T.close([{ target, value: (): number => radius, set: (value: number): void => { radius = value; }, read }], surface);
  TestValidator.predicate("assembled closure is green", nclose(read(surface()), target, 0.01));

  const keys: P.IKey[] = [{ station: 0, girth: 120 }, { station: 100, girth: 340 }, { station: 200, girth: 300 }, { station: 300, girth: 500 }];
  for (let j: number = 1; j < keys.length; j++) {
    const a: P.IKey = keys[j - 1]!;
    const b: P.IKey = keys[j]!;
    let previous: number = a.girth;
    for (let step: number = 1; step <= 100; step++) {
      const value: number = P.evaluate(keys, a.station + (b.station - a.station) * step / 100);
      TestValidator.predicate("no profile overshoot", value >= Math.min(a.girth, b.girth) && value <= Math.max(a.girth, b.girth));
      TestValidator.predicate("one direction per interval", (value - previous) * (b.girth - a.girth) >= 0);
      previous = value;
    }
  }
  TestValidator.predicate("held lower end", nclose(P.evaluate(keys, -10), 120, 1e-12));
  TestValidator.predicate("held upper end", nclose(P.evaluate(keys, 310), 500, 1e-12));
  for (const pair of [[285, 295], [341, 327]] as const) {
    const [calf, knee] = pair;
    const muscle: P.IKey[] = [{ station: 0, girth: 180 }, { station: 100, girth: calf }, { station: 200, girth: Math.min(calf, knee) }, { station: 300, girth: knee }];
    const rings: T.IRing[] = tube((station: number): number => P.evaluate(muscle, station) / (2 * Math.PI), 0);
    const maximum: T.IReading | null = T.maximum(rings, 70, 200);
    TestValidator.predicate("complete muscle maximum answers calf", maximum !== null && nclose(maximum.girth, calf, 0.02));
    if (knee > calf) {
      const old: P.IKey[] = muscle.filter((key: P.IKey): boolean => key.station !== 200);
      const wrong: T.IRing[] = tube((station: number): number => P.evaluate(old, station) / (2 * Math.PI), 0);
      TestValidator.predicate("unseparated bone transition is red", T.maximum(wrong, 70, 200)!.girth > calf + 4);
      TestValidator.predicate("larger bony knee remains visible outside muscle domain", T.horizontal(rings, 290)!.girth > calf + 9);
    }
  }
  for (const corner of [1, 3, 10]) {
    const h: number = corner * 0.0001;
    const second: (f: (depth: number) => number) => number = (f: (depth: number) => number): number => (2 * f(0) - 5 * f(h) + 4 * f(2 * h) - f(3 * h)) / (h * h);
    const old: (depth: number) => number = (depth: number): number => Math.hypot(depth, corner) - corner;
    const corrected: (depth: number) => number = (depth: number): number => T.cornerAdvance(depth, corner);
    TestValidator.predicate("quadratic opening fails zero root curvature", Math.abs(second(old)) > 0.9 / corner);
    TestValidator.predicate("cubic opening keeps zero root curvature", Math.abs(second(corrected)) < 0.000001 / corner);
    let previous: number = 0;
    for (let i: number = 1; i <= 100; i++) {
      const depth: number = i * corner;
      const advance: number = corrected(depth);
      TestValidator.predicate("corner grows monotonically", advance > previous && advance < depth);
      previous = advance;
    }
  }
  const malformed: T.IRing[] = tube(20, 0);
  malformed[1] = { ...malformed[1]!, points: malformed[1]!.points.slice(1) };
  let rejected: boolean = false;
  try { T.horizontal(malformed, 20); } catch { rejected = true; }
  TestValidator.predicate("phase mismatch rejected", rejected);
}

/** Straight cylinder sampled in sections normal to its tilted axis. */
function tube(radius: number | ((station: number) => number), angle: number): T.IRing[] {
  return Array.from({ length: 31 }, (_: unknown, k: number): T.IRing => {
    const station: number = 10 * k;
    const size: number = typeof radius === "number" ? radius : radius(station);
    return { station, points: Array.from({ length: 256 }, (_: unknown, j: number): T.V3 => {
      const phase: number = 2 * Math.PI * j / 256;
      return [station * Math.tan(angle) + size * Math.cos(angle) * Math.cos(phase), station - size * Math.sin(angle) * Math.cos(phase), size * Math.sin(phase)];
    }) };
  });
}

/** Midpoint integration of the speed of an analytic ellipse, independent of cuts. */
function ellipse(a: number, b: number): number {
  let sum: number = 0;
  for (let j: number = 0; j < 16384; j++) {
    const phase: number = (j + 0.5) * 2 * Math.PI / 16384;
    sum += Math.hypot(a * Math.sin(phase), b * Math.cos(phase));
  }
  return sum * 2 * Math.PI / 16384;
}
