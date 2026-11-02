import { AutoMovieHumanTrunkPolyline as Polyline } from "../../../../packages/human/src/generation/AutoMovieHumanTrunkPolyline";
import { HumanFixtureAudit } from "../internal/HumanFixtureAudit";

/**
 * Prepared trunk outlines preserve physical interpolation and exact existing arithmetic.
 *
 * Scenarios:
 * 1. A 3-4 right-angle polyline has length seven and point (3,2) at fraction 5/7.
 * 2. A physically shortened second segment is red against that same oracle.
 * 3. Doubling both coordinates doubles the actual observed point.
 * 4. Nonuniform, repeated and tiny segments agree bitwise with the original
 *    sequential prefix implementation over 2049 fractions per outline.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the prepared sampler used by real joined shoulder rings and uniform trunk rings. Actual normal coordinates are green, a shortened actual line is red, and a doubled actual line has a known response. Dense comparisons exercise the original operation order without replacing the production sampler.
 * @evidence contracts/testing.md#independent-expectations Euclidean segment lengths are independently 3 and 4; five units of travel reach (3,2). Coordinate scaling by two gives (6,4). The preserved original arithmetic is a separate exact-output optimization reference, not an anatomical oracle or a claim that all source geometry is sound.
 * @evidence contracts/testing.md#distinguishing-cases Covers a corner, known dimension changes, repeated and sub-nanometre segments, large translations, exact endpoints and 2049 interior fractions. Object.is checks both coordinates without a numerical tolerance; analytic controls use 1e-12 mm arithmetic allowance.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous portable CPU unit; immutable local polylines only, with no person generation, cache, process, viewer or host dependency.
 */
export function test_human_trunk_polyline(): void {
  const audit: HumanFixtureAudit = new HumanFixtureAudit("prepared-trunk-polyline", "actual-physical-points-and-exact-output");
  const normal: [number, number][] = [[0, 0], [3, 0], [3, 4]];
  audit.run({ scenario: "1-3 independent physical normal defect delta", part: "outline", interval: [0, 3, 7], station: 5, phase: 5 / 7 }, (): void => {
    const point: [number, number] = Polyline.prepare(normal)(5 / 7);
    audit.vector("normal right-angle physical point", point, [3, 2], 1e-12, "mm");
    audit.reject("actual shortened outline is not the normal geometry", Polyline.prepare([[0, 0], [3, 0], [3, 2]])(5 / 7)[1], 2, 1e-12, "mm");
    audit.vector("known coordinate scale response", Polyline.prepare([[0, 0], [6, 0], [6, 8]])(5 / 7), [6, 4], 1e-12, "mm");
  });
  const lines: [number, number][][] = [normal, [[1e6, -1e6], [1e6, -1e6], [1e6 + 0.1, -1e6 + 0.3], [1e6 + 3, -1e6 + 4]], [[0, 0], [1e-12, -1e-12], [0.123456789, 19.987654321], [0.123456789, 19.987654321], [-17.12345, 31.6789]]];
  lines.forEach((line: [number, number][], ordinal: number): void => {
    const sample: (fraction: number) => [number, number] = Polyline.prepare(line);
    for (let index: number = 0; index <= 2048; index++) {
      const fraction: number = index / 2048;
      const actual: [number, number] = sample(fraction);
      const expected: [number, number] = original(line, fraction);
      audit.scope({ scenario: "4 exact preserved sequential operation order", part: "outline/" + ordinal, interval: line, station: fraction, coordinates: actual, expected });
      audit.check("bitwise original X", Object.is(actual[0], expected[0]));
      audit.check("bitwise original Z", Object.is(actual[1], expected[1]));
    }
  });
  audit.finish();
}

/** Exact pre-optimization implementation, retained solely as an output-equivalence reference. */
function original(line: [number, number][], fraction: number): [number, number] {
  if (line.length < 2) return line[0]!;
  const lengths: number[] = [0];
  for (let i: number = 1; i < line.length; i++) lengths.push(lengths[i - 1]! + Math.hypot(line[i]![0] - line[i - 1]![0], line[i]![1] - line[i - 1]![1]));
  const d: number = fraction * lengths[lengths.length - 1]!;
  let i: number = 0;
  while (i < line.length - 2 && lengths[i + 1]! < d) i++;
  const w: number = (d - lengths[i]!) / Math.max(1e-9, lengths[i + 1]! - lengths[i]!);
  return [line[i]![0] + w * (line[i + 1]![0] - line[i]![0]), line[i]![1] + w * (line[i + 1]![1] - line[i]![1])];
}
