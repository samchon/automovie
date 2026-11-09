/**
 * Minimal Node entry: separates runtime bootstrap from loading the production/tool import graph.
 * The package script supplies the Human main tsconfig and --no-plugins; no environment is changed.
 */
export async function HumanCurveCost(argv: readonly string[]): Promise<void> {
  const startedUtc: string = new Date().toISOString();
  const started: number = performance.now();
  process.stdout.write(JSON.stringify({ event: "entry-start", entry: "HumanCurveCost", utc: startedUtc }) + "\n");
  const sourceCases: boolean = argv.includes("--source-cases");
  if (argv.filter((value: string): boolean => value === "--source-cases").length > 1)
    throw new Error("The Cost source-cases mode may be selected only once");
  const run: typeof import("./RunHumanCurveCost.js")["RunHumanCurveCost"] = sourceCases
    ? (await import("./HumanCurveCostSources.js")).HumanCurveCostSources
    : (await import("./RunHumanCurveCost.js")).RunHumanCurveCost;
  const importMilliseconds: number = performance.now() - started;
  process.stdout.write(JSON.stringify({ event: "production-import-ready", entry: "HumanCurveCost", utc: new Date().toISOString(), milliseconds: importMilliseconds, boundary: "Runtime loader/deferred preparation and production import/evaluation; not pure compilation time" }) + "\n");
  await run(argv.filter((value: string): boolean => value !== "--source-cases"), { startedUtc, importMilliseconds });
}

if (require.main === module) HumanCurveCost(process.argv.slice(2)).catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
