import { createHash } from "node:crypto";
import fs, { type BigIntStats } from "node:fs";
import path from "node:path";

/**
 * Minimal Node entry: separates runtime bootstrap from loading the production/tool import graph.
 * The package script supplies the Human main tsconfig and --no-plugins; no environment is changed.
 */
export async function NodeCanvasExperiment(argv: readonly string[]): Promise<void> {
  const startedUtc: string = new Date().toISOString();
  const compilerBefore: Record<string, unknown> = compiler();
  process.stdout.write(JSON.stringify({ event: "entry-start", entry: "NodeCanvasExperiment", utc: startedUtc, compiler: compilerBefore }) + "\n");
  const started: number = performance.now();
  let runtime: typeof import("./RunHumanNodeCanvas.js");
  try {
    runtime = await import("./RunHumanNodeCanvas.js");
  } catch (error: unknown) {
    process.stdout.write(JSON.stringify({ event: "production-import-failed", utc: new Date().toISOString(), milliseconds: performance.now() - started, compilerBefore, compilerAfter: compiler() }) + "\n");
    throw error;
  }
  const importMilliseconds: number = performance.now() - started;
  process.stdout.write(JSON.stringify({ event: "production-import-ready", entry: "NodeCanvasExperiment", utc: new Date().toISOString(), milliseconds: importMilliseconds, compilerAfter: compiler(), boundary: "Runtime loader/deferred preparation and production import/evaluation; not pure compilation time. Compiler byte observations bracket this interval without changing loader policy." }) + "\n");
  await runtime.RunHumanNodeCanvas(argv, { startedUtc, importMilliseconds });
}

/** Observe this installed TypeScript distribution's actual native executable without changing its bytes, cache, environment or admission. A failed observation remains metadata, never a fallback compiler. */
function compiler(): Record<string, unknown> {
  try {
    const typescript: string = require.resolve("typescript/package.json");
    const platform: string = require.resolve("@typescript/typescript-" + process.platform + "-" + process.arch + "/package.json", { paths: [path.dirname(typescript)] });
    const executable: string = path.join(path.dirname(platform), "lib", process.platform === "win32" ? "tsc.exe" : "tsc");
    const physical: string = fs.realpathSync.native(executable);
    const before: BigIntStats = fs.statSync(physical, { bigint: true });
    const sha256: string = createHash("sha256").update(fs.readFileSync(physical)).digest("hex");
    const after: BigIntStats = fs.statSync(physical, { bigint: true });

    /** Preserve native integer precision instead of rounding filesystem stamps through a JSON number. */
    const facts: (value: BigIntStats) => Record<string, string> = (value: BigIntStats): Record<string, string> => ({ dev: String(value.dev), ino: String(value.ino), mode: String(value.mode), size: String(value.size), mtimeNs: String(value.mtimeNs), ctimeNs: String(value.ctimeNs) });
    return { executable, physical, sha256, before: facts(before), after: facts(after), selection: "Installed native TypeScript distribution shared by Human/engine; external custom compiler overrides are not asserted by this observation" };
  } catch (error: unknown) {
    return { state: "unavailable", detail: error instanceof Error ? error.message : String(error) };
  }
}

if (require.main === module) NodeCanvasExperiment(process.argv.slice(2)).catch((error: unknown): void => {
  process.stderr.write((error instanceof Error ? error.stack ?? error.message : String(error)) + "\n");
  process.exitCode = 1;
});
