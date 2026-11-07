import { TestValidator } from "@nestia/e2e";

import { PhysicalHumanFixtures } from "../internal/PhysicalHumanFixtures";
import { measurePhysicalHumanImpulse } from "../internal/measurePhysicalHumanImpulse";

/** Actual Human head and trunk respond to increased momentum and recover within the declared 0.8-second compliance interval. */
export async function test_physical_human_impulse(): Promise<void> {
  const observations: Awaited<ReturnType<typeof measurePhysicalHumanImpulse>> =
    await measurePhysicalHumanImpulse(PhysicalHumanFixtures.get().profile);
  const findings: string[] = [];
  for (const strength of [0.2, 1])
    for (const bone of ["head", "chest"]) {
      const low: (typeof observations)[number]["measurements"][number] =
        observations
          .find(
            (row: (typeof observations)[number]): boolean =>
              row.impulse === 2 && row.strength === strength,
          )!
          .measurements.find(
            (row: {
              bone: string;
              peak: number;
              atWindowEnd: number;
              final: number;
            }): boolean => row.bone === bone,
          )!;
      const high: typeof low = observations
        .find(
          (row: (typeof observations)[number]): boolean =>
            row.impulse === 4 && row.strength === strength,
        )!
        .measurements.find(
          (row: {
            bone: string;
            peak: number;
            atWindowEnd: number;
            final: number;
          }): boolean => row.bone === bone,
        )!;
      if (!(low.peak > 0.001 && high.peak > low.peak * 1.5))
        findings.push(
          `${bone}/${strength}: head momentum did not increase actual displacement`,
        );
      for (const row of [low, high])
        if (row.atWindowEnd > 0.005 || row.final > 0.001)
          findings.push(
            `${bone}/${strength}: compliance recovery ${JSON.stringify(row)}`,
          );
    }
  TestValidator.equals(
    "all actual Human head/trunk impulse outcomes",
    findings,
    [],
  );
}
