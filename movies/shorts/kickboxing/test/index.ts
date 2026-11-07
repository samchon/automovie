import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { readMovieTestSelection } from "./internal/readMovieTestSelection";

/** Program body entry after its static imports; compiler and loader preparation precede this boundary. */
const mainEnteredEpochMs: number = Date.now();
/** Monotonic program interval, independent of epoch clock adjustments. */
const runnerStarted: number = performance.now();
console.log(
  JSON.stringify({
    stage: "main-entered",
    pid: process.pid,
    parentPid: process.ppid,
    epochMs: mainEnteredEpochMs,
  }),
);

/** Discover portable cases, finish every selected function and report one complete round. */
async function main(): Promise<void> {
  const selection: readMovieTestSelection.ISelection = readMovieTestSelection(
    process.argv.slice(2),
  );
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
  for (const entry of files) {
    if (!selection.acceptFile(entry)) continue;
    const file: string = path.join(root, entry);
    try {
      const importStarted: number = performance.now();
      console.log(
        JSON.stringify({
          stage: "import-start",
          file: entry,
          epochMs: Date.now(),
        }),
      );
      let module: Record<string, unknown>;
      try {
        module = await import(pathToFileURL(file).href);
        const milliseconds: number = performance.now() - importStarted;
        fileImports.push({
          file: entry,
          milliseconds,
          ok: true,
        });
        console.log(
          JSON.stringify({
            stage: "import-end",
            file: entry,
            milliseconds,
            ok: true,
          }),
        );
      } catch (error: unknown) {
        const milliseconds: number = performance.now() - importStarted;
        fileImports.push({
          file: entry,
          milliseconds,
          ok: false,
        });
        console.error(
          JSON.stringify({
            stage: "import-end",
            file: entry,
            milliseconds,
            ok: false,
            error:
              error instanceof Error
                ? (error.stack ?? error.message)
                : String(error),
          }),
        );
        throw error;
      }
      for (const [name, value] of Object.entries(module)) {
        if (!name.startsWith("test_") || typeof value !== "function") continue;
        if (!selection.acceptCase(entry, name)) continue;
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
          const message: string =
            error instanceof Error
              ? (error.stack ?? error.message)
              : String(error);
          results.push({
            file: entry,
            test: name,
            ok: false,
            ms: performance.now() - begun,
            error: message,
          });
          console.error(
            JSON.stringify({
              stage: "case-error",
              file: entry,
              test: name,
              error: message,
            }),
          );
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
