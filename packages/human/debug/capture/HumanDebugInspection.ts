import path from "node:path";
import fs from "node:fs/promises";
import { HumanDebugInspectionPlan } from "./HumanDebugInspectionPlan";
import { HumanDebugInspectionRun } from "./HumanDebugInspectionRun";
import type { IHumanDebugInspectionPlan } from "./IHumanDebugInspectionPlan";

/** Tracked ttsx entry: --plan <data.json> [--resume], from the repository root against the existing viewer. */
export async function HumanDebugInspection(argv: readonly string[]): Promise<void> {
  if (argv.length !== 2 && argv.length !== 3 || argv[0] !== "--plan" || argv[1] === undefined || argv.length === 3 && argv[2] !== "--resume")
    throw new Error("Usage: ttsx -P packages/human/tsconfig.debug.scripts.json packages/human/debug/capture/HumanDebugInspection.ts --plan <data.json> [--resume]");
  const root: string = process.cwd();
  await fs.access(path.join(root, "packages/human/debug/server/HumanDebugBatch.ts"));
  const plan: IHumanDebugInspectionPlan = await HumanDebugInspectionPlan.read(path.resolve(argv[1]));
  const manifest: IHumanDebugInspectionPlan.Manifest = await HumanDebugInspectionRun(root, plan, argv[2] === "--resume");
  const counts: Record<string, number> = {};
  for (const row of manifest.rows) counts[row.status] = (counts[row.status] ?? 0) + 1;
  process.stdout.write(JSON.stringify({ packet: manifest.out, source: manifest.source, counts, preparations: manifest.preparations, reviewStatus: "unreviewed" }) + "\n");
  if (manifest.rows.some((row: IHumanDebugInspectionPlan.Row): boolean => row.status !== "done")) process.exitCode = 1;
}

HumanDebugInspection(process.argv.slice(2)).catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
