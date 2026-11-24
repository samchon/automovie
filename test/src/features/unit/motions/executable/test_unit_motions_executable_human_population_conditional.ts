import { HumanPopulationConditional } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** How near a conditional moment comes to its closed form: rounding only. */
const EXACT: number = 1e-9;

/**
 * `HumanPopulationConditional.moments` conditions one surveyed measure on
 * others under the sex's multivariate normal: with one known measure `k` it is
 * the bivariate regression `mu_t + r sd_t / sd_k (v_k - mu_k)` with the
 * residual deviation `sd_t sqrt(1 - r^2)`, and with none it is the marginal.
 *
 * The female table of ANSUR 1988 (Gordon et al. 1989) gives stature 1629.37 mm
 * (SD 63.604), mass 62.01 kg (SD 8.351) and their correlation 0.5287.
 *
 * Scenarios:
 *
 * 1. `index` places stature first, mass second and the ear's protrusion last.
 * 2. With nothing known, mass takes its marginal mean and deviation.
 * 3. With stature one deviation above its mean, mass rises by `r sd` and its
 *    deviation narrows to `sd sqrt(1 - r^2)`.
 * 4. A stature at its mean leaves the mean unchanged but still narrows the
 *    deviation.
 */
export function test_unit_motions_executable_human_population_conditional(): void {
  // 1. Indices.
  TestValidator.equals(
    "the survey order",
    [
      HumanPopulationConditional.index("stature"),
      HumanPopulationConditional.index("mass"),
      HumanPopulationConditional.index("earProtrusion"),
    ],
    [0, 1, 37],
  );

  // 2. The marginal.
  const marginal: HumanPopulationConditional.IMoments =
    HumanPopulationConditional.moments("female", new Map(), 1);
  TestValidator.predicate(
    "nothing known keeps the marginal",
    nclose(marginal.mean, 62.01, EXACT) && nclose(marginal.sd, 8.351, EXACT),
  );

  // 3. One deviation taller.
  const r: number = 0.5287;
  const taller: HumanPopulationConditional.IMoments =
    HumanPopulationConditional.moments(
      "female",
      new Map([[0, 1629.37 + 63.604]]),
      1,
    );
  TestValidator.predicate(
    "the bivariate regression",
    nclose(taller.mean, 62.01 + r * 8.351, EXACT) &&
      nclose(taller.sd, 8.351 * Math.sqrt(1 - r * r), EXACT),
  );

  // 4. At the mean.
  const average: HumanPopulationConditional.IMoments =
    HumanPopulationConditional.moments("female", new Map([[0, 1629.37]]), 1);
  TestValidator.predicate(
    "a mean stature keeps the mean mass",
    nclose(average.mean, 62.01, EXACT) && nclose(average.sd, taller.sd, EXACT),
  );
}
