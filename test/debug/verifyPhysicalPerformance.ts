import { mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { PhysicalHumanFixtures } from "../src/features/internal/PhysicalHumanFixtures";
import { benchmarkPhysicalActiveHumans } from "./benchmarkPhysicalActiveHumans";

/** Measure the reference Simulation.compute function and its numerical quality. */
async function main(): Promise<void> {
  const action: string | undefined = process.argv[2];
  const directory: string = path.resolve(
    process.argv[3] ?? ".cache/physical-performance-measurements",
  );
  const duration: number = Number(process.argv[4] ?? 180);
  if (action !== "active-benchmark")
    throw new Error(
      "Usage: verifyPhysicalPerformance active-benchmark [output-directory] [benchmark-seconds]",
    );
  if (!(duration > 0) || !Number.isSafeInteger(duration * 120))
    throw new Error(
      "Benchmark duration must contain a positive integral number of 120 Hz intervals",
    );

  await mkdir(directory, { recursive: true });
  const prepared: number = performance.now();
  const person: ReturnType<typeof PhysicalHumanFixtures.get> =
    PhysicalHumanFixtures.get();
  const providerPreparationSeconds: number =
    (performance.now() - prepared) / 1000;
  const rows: object[] = await benchmarkPhysicalActiveHumans(person, duration);
  const observations: object[] = rows.map((row: object): object => ({
    ...row,
    providerPreparationSeconds,
  }));

  const report: object = {
    node: process.version,
    platform: process.platform,
    architecture: process.arch,
    cpu: os.cpus()[0]?.model,
    logicalCpus: os.cpus().length,
    observations,
  };
  await writeFile(
    path.join(directory, `${action}.json`),
    JSON.stringify(report, null, 2),
    "utf8",
  );
  console.log(JSON.stringify(report));

  // A completed measurement is not qualification when either declared gate fails.
  if (
    observations.some(
      (row: object): boolean =>
        Reflect.get(row, "withinBudget") !== true ||
        Reflect.get(row, "withinQuality") !== true,
    )
  )
    process.exitCode = 1;
}

void main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
