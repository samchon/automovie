import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** Program entry after static builtin imports; command preparation precedes this boundary. */
const mainEnteredEpochMs: number = Date.now();
/** Monotonic program interval, independent of epoch clock adjustments. */
const runnerStarted: number = performance.now();

/** Discover portable cases, finish every selected function and report one complete round. */
async function main(): Promise<void> {
  const discoveryStarted: number = performance.now();
  const root: string = path.join(import.meta.dirname, "features");
  const files: string[] = (await readdir(root, { recursive: true }))
    .filter((entry: string): boolean =>
      /^test_[^/\\]+\.ts$/u.test(path.basename(entry)),
    )
    .sort((a: string, b: string): number => a.localeCompare(b));
  const discoveryMs: number = performance.now() - discoveryStarted;
  const fileImports: { file: string; milliseconds: number; ok: boolean }[] = [];
  const results: {
    file: string;
    test: string;
    ok: boolean;
    ms: number;
    error?: string;
  }[] = [];
  const selection: string | undefined = process.argv.includes("--include")
    ? process.argv[process.argv.indexOf("--include") + 1]
    : undefined;
  if (process.argv.includes("--include") && !selection)
    throw new Error("--include requires a test file or function substring");
  for (const entry of files) {
    const file: string = path.join(root, entry);
    try {
      const importStarted: number = performance.now();
      let module: Record<string, unknown>;
      try {
        module = await import(pathToFileURL(file).href);
        fileImports.push({
          file: entry,
          milliseconds: performance.now() - importStarted,
          ok: true,
        });
      } catch (error: unknown) {
        fileImports.push({
          file: entry,
          milliseconds: performance.now() - importStarted,
          ok: false,
        });
        throw error;
      }
      for (const [name, value] of Object.entries(module)) {
        if (!name.startsWith("test_") || typeof value !== "function") continue;
        if (
          selection &&
          !entry.includes(selection) &&
          !name.includes(selection)
        )
          continue;
        const begun: number = performance.now();
        console.log(`RUN ${entry}#${name}`);
        try {
          await (value as () => void | Promise<void>)();
          results.push({
            file: entry,
            test: name,
            ok: true,
            ms: performance.now() - begun,
          });
          console.log(
            `PASS ${name} ${(performance.now() - begun).toFixed(2)} ms`,
          );
        } catch (error: unknown) {
          results.push({
            file: entry,
            test: name,
            ok: false,
            ms: performance.now() - begun,
            error:
              error instanceof Error
                ? (error.stack ?? error.message)
                : String(error),
          });
          console.log(
            `FAIL ${name} ${(performance.now() - begun).toFixed(2)} ms`,
          );
        }
      }
    } catch (error: unknown) {
      results.push({
        file: entry,
        test: "module-import",
        ok: false,
        ms: 0,
        error:
          error instanceof Error
            ? (error.stack ?? error.message)
            : String(error),
      });
    }
  }
  if (
    !results.length ||
    results.some((item: { ok: boolean }): boolean => !item.ok)
  )
    process.exitCode = 1;
  const reportStarted: number = performance.now();
  console.log(
    JSON.stringify(
      { scope: "portable module and original-Human consumer tests", results },
      null,
      2,
    ),
  );
  const reportEnqueueMs: number = performance.now() - reportStarted;
  const runnerElapsedMs: number = performance.now() - runnerStarted;
  const fileImportMs: number = fileImports.reduce(
    (sum: number, item: { milliseconds: number }): number =>
      sum + item.milliseconds,
    0,
  );
  const caseExecutionMs: number = results.reduce(
    (sum: number, item: { ms: number }): number => sum + item.ms,
    0,
  );
  console.log(
    JSON.stringify(
      {
        timing: {
          mainEnteredEpochMs,
          measuredMainEndEpochMs: Date.now(),
          runnerElapsedMs,
          discoveryMs,
          fileImports,
          fileImportMs,
          caseExecutionMs,
          reportEnqueueMs,
          runnerOtherMs:
            runnerElapsedMs -
            discoveryMs -
            fileImportMs -
            caseExecutionMs -
            reportEnqueueMs,
          boundaries:
            "Case intervals include RUN logging. Report is JSON serialization and console enqueue, not stream flush. This timing-summary enqueue and child cleanup lie after measuredMainEnd. Join the independent driver spawn/close epochs after execution; no per-run timestamp is a child environment or argv input. Epoch gaps are approximate.",
        },
      },
      null,
      2,
    ),
  );
}

void main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
