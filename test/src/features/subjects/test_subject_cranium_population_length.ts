import { resolvePortraitCraniumShape } from "@automovie/human/face/anatomy/cranium/resolvePortraitCraniumShape";
import { TestValidator } from "@nestia/e2e";

import { humanFaceFixture } from "../internal/humanFaceFixture";

/**
 * The default cranium is as long as a member of the measured adult population
 * can be, and as long as that population's sex-neutral mean. The population is
 * the ANSUR II public data release (2012 US Army survey), whose `headlength`
 * column, computed from its records, has female mean 189.8 mm with fifth
 * percentile 178 mm (n = 1986) and male mean 199.5 mm with ninety-fifth
 * percentile 211 mm (n = 4082). The default names no sex, so it takes the
 * equal-weight mean of the two means, 194.7 mm.
 *
 * Head length is measured from the basis's glabella landmark (landmark 9 of
 * the fixture host) to the rearmost point of the occipital cap, which is the
 * last station's depth less the cap bulge.
 *
 * Scenarios:
 * 1. The default head length is within one millimetre of the pooled mean.
 * 2. It lies inside the release's female fifth to male ninety-fifth percentile
 *    band, so no measured adult is longer or shorter than this default by
 *    more than the population itself.
 * 3. The negative twin: the earlier posterior stations (last depth -117 mm)
 *    give 180 mm, more than 14 mm under the pooled mean, so scenario 1
 *    distinguishes the two cranial defaults.
 */
export const test_subject_cranium_population_length = (): void => {
  const glabella = humanFaceFixture().basis.host.positions[9][2];
  const pooledMean = (189.8 + 199.5) / 2;
  const length = (lastStationZ: number, capDepth: number): number =>
    glabella - (lastStationZ - capDepth);
  const { stations, capDepth } = resolvePortraitCraniumShape(-84);
  const current = length(stations[stations.length - 1].z, capDepth);
  TestValidator.predicate(
    "default head length matches the pooled mean",
    Math.abs(current - pooledMean) < 1,
  );
  TestValidator.predicate(
    "default head length lies inside the measured band",
    current >= 178 && current <= 211,
  );
  TestValidator.predicate(
    "the earlier default was more than 14 mm under the pooled mean",
    pooledMean - length(-117, 4) > 14,
  );
};
