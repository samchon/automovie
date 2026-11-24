import { HumanPopulationAudit } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `HumanPopulationAudit.passes` admits a row whose value lies in its closed
 * band.
 *
 * Scenarios:
 *
 * 1. A value inside the band and one on each bound pass.
 * 2. A value just below the low bound or above the high bound fails.
 */
export function test_unit_motions_executable_human_population_passes(): void {
  const row = (value: number): HumanPopulationAudit.IRow => ({
    person: "p",
    site: "s",
    value,
    low: 1,
    high: 2,
    unit: "mm",
  });
  TestValidator.equals(
    "inside, on the bounds and outside",
    [1.5, 1, 2, 0.999, 2.001].map((value: number): boolean =>
      HumanPopulationAudit.passes(row(value)),
    ),
    [true, true, true, false, false],
  );
}
