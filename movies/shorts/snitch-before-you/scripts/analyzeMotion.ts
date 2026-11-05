import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { analyzeFlightSamples } from "../src/analyzeFlightSamples";

/**
 * Consume actual browser observations once and retain the whole dynamics audit.
 *
 * @evidence contracts/common.md#implementation-and-ownership Hashes the input bytes, checks the displayed frame population through the pure audit owner, and records every failed gate together. Does not synthesize substitute poses or suppress diagnostics.
 * @evidence contracts/common.md#authoring-interface Run with actual observations JSON path and output JSON path. Exit1 means observed failures, while malformed/incomplete data rejects the command. No viewer or media is modified.
 */
export async function analyzeMotion(): Promise<void> {
  const input: string = process.argv[2] ?? ".cache/motion-dynamics/whole-observations.json";
  const output: string = process.argv[3] ?? "docs/analysis/motion-dynamics-observations.json";
  const bytes: Buffer = await readFile(input);
  const observed: { frames: Parameters<typeof analyzeFlightSamples>[0] } = JSON.parse(bytes.toString("utf8"));
  const report: ReturnType<typeof analyzeFlightSamples> = analyzeFlightSamples(observed.frames);
  await writeFile(output, JSON.stringify({ input, inputSha256: createHash("sha256").update(bytes).digest("hex"), measuredAt: new Date().toISOString(), ...report }, null, 2) + "\n");
  console.log({ samples: report.samples, extrema: report.extrema, failures: report.failures.length });
  if (report.failures.length > 0) process.exitCode = 1;
}
void analyzeMotion().catch((error: unknown): void => { console.error(error); process.exitCode = 2; });
