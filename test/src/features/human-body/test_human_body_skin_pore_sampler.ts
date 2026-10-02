import { createHumanBodySkinPoreSampler } from "@automovie/human/body/basis/appearance/createHumanBodySkinPoreSampler";
import { TestValidator } from "@nestia/e2e";

/**
 * Physical density controls the represented cardinality independently of a
 * square grid. Fixed expected counts are the oracle, not a second copy of the
 * producer's rounding formula. These are analytic sampling fixtures, not new
 * measured human skin values.
 *
 * Scenarios:
 * 1. 22/cm² on a 10 mm square represents 22 centres; doubling the side gives
 *    88. Fractional expectation, zero, one and half-integer twins round as stated.
 * 2. The 22 points occupy one each of the declared 22 equal-area strata, in
 *    periodic unit coordinates. Float64-byte replay is exact and another seed varies it.
 */
export const test_human_body_skin_pore_sampler = (): void => {
  for (const [density, side, expected] of [
    [22, 10, 22], [22, 20, 88], [0, 10, 0], [1, 10, 1],
    [0.22, 100, 22], [0.499, 10, 0], [0.5, 10, 1],
    [1.499, 10, 1], [1.5, 10, 2],
  ])
    TestValidator.equals(
      "physical tile cardinality",
      createHumanBodySkinPoreSampler({
        seed: 1, tileMillimetres: side, perSquareCentimetre: density,
      }).count,
      expected,
    );
  const prepare = (seed: number) => createHumanBodySkinPoreSampler({
    seed, tileMillimetres: 10, perSquareCentimetre: 22,
  });
  const first = prepare(1);
  const repeated = prepare(1);
  const changed = prepare(2);
  const points = Array.from({ length: 22 }, (_, index) => first.at(index));
  // Replay compares the explicit Float64 representation, not deep float values.
  const bytesOf = (samples: [number, number][]) =>
    Array.from(new Uint8Array(new Float64Array(samples.flat()).buffer));
  const originalBytes = bytesOf(points);
  const repeatedBytes = bytesOf(Array.from({ length: 22 }, (_, index) => repeated.at(index)));
  const changedBytes = bytesOf(Array.from({ length: 22 }, (_, index) => changed.at(index)));
  TestValidator.equals("identical seeds replay explicit Float64 bytes", originalBytes, repeatedBytes);
  TestValidator.predicate("another seed varies the explicit Float64 pattern",
    originalBytes.some((value, index) => value !== changedBytes[index]));
  TestValidator.predicate("periodic unit-tile positions",
    points.every((point) => point.every((value) => Number.isFinite(value) && value >= 0 && value < 1)));
  // Independently specified geometry: two rows of five cells and three of four.
  const bands = [0, 5 / 22, 10 / 22, 14 / 22, 18 / 22, 1];
  const widths = [5, 5, 4, 4, 4];
  const occupied = new Set<string>();
  for (const [u, v] of points) {
    const row = bands.findIndex((lower, index) =>
      index < 5 && v >= lower && v < bands[index + 1]);
    TestValidator.predicate("a point belongs to a declared stratum", row >= 0);
    occupied.add(row + "/" + Math.floor(u * widths[row]));
  }
  TestValidator.equals("one point per equal-area stratum", occupied.size, 22);
};
