import { createHumanBodySkinPoreSampler } from "@automovie/human/body/basis/appearance/createHumanBodySkinPoreSampler";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Sampling refuses malformed units, nonrepresentable area/count and invalid
 * ordinal indices before emission. Empty and the adjacent maximum safe count
 * prepare without allocating a point array.
 *
 * Scenarios:
 * 1. Nonfinite seed/density/side, negative density and nonpositive side refuse.
 * 2. Positive sides with unrepresentable area and unsafe counts refuse; the
 *    adjacent maximum safe population prepares lazily with finite samples.
 * 3. Negative, fractional, nonfinite and past-end indices refuse, including
 *    index zero of an empty population.
 */
export const test_human_body_skin_pore_sampler_admission = (): void => {
  const input = { seed: 1, tileMillimetres: 10, perSquareCentimetre: 22 };
  for (const invalid of [
    { seed: NaN }, { seed: Infinity }, { tileMillimetres: 0 },
    { tileMillimetres: -1 }, { tileMillimetres: NaN },
    { tileMillimetres: Infinity }, { perSquareCentimetre: -1 },
    { perSquareCentimetre: NaN }, { perSquareCentimetre: Infinity },
  ])
    TestValidator.predicate("malformed statistical input refused",
      throwsError(() => createHumanBodySkinPoreSampler({ ...input, ...invalid }), "finite seed"));
  for (const side of [1e-200, 1e308])
    TestValidator.predicate("unrepresentable positive tile area refused",
      throwsError(() => createHumanBodySkinPoreSampler({ ...input, tileMillimetres: side }), "tile area"));
  for (const density of [Number.MAX_SAFE_INTEGER + 1, Number.MAX_VALUE])
    TestValidator.predicate("unsafe population refused",
      throwsError(() => createHumanBodySkinPoreSampler({ ...input, perSquareCentimetre: density }), "safe integer population"));
  const maximum = createHumanBodySkinPoreSampler({ ...input, perSquareCentimetre: Number.MAX_SAFE_INTEGER });
  TestValidator.equals("adjacent maximum valid population prepares lazily", maximum.count, Number.MAX_SAFE_INTEGER);
  TestValidator.predicate("large samples remain finite periodic coordinates",
    [maximum.at(0), maximum.at(Number.MAX_SAFE_INTEGER - 1)].every((point) =>
      point.every((value) => Number.isFinite(value) && value >= 0 && value < 1)));
  for (const index of [-1, 0.5, NaN, Infinity, 22])
    TestValidator.predicate("invalid population index refused",
      throwsError(() => createHumanBodySkinPoreSampler(input).at(index), "index inside"));
  TestValidator.predicate("empty population admits no sample",
    throwsError(() => createHumanBodySkinPoreSampler({ ...input, perSquareCentimetre: 0 }).at(0), "index inside"));
};
