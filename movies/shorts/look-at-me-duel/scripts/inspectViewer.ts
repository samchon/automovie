import { DEFAULT_CHROME_EXECUTABLE } from "@automovie/render";
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { type Server, createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Actual public driver subset used by this observer, with no browser transport implementation. */
interface BrowserDriver {
  chromium: {
    launch: (options: {
      executablePath: string;
      headless: boolean;
      timeout: number;
      args?: string[];
    }) => Promise<{
      newPage: (options: {
        viewport: { width: number; height: number };
      }) => Promise<{
        goto: (url: string, options: { timeout: number }) => Promise<unknown>;
        evaluate: {
          <T>(task: () => T): Promise<Awaited<T>>;
          <T, A>(task: (argument: A) => T, argument: A): Promise<Awaited<T>>;
        };
        on: {
          (event: "pageerror", listener: (error: Error) => void): unknown;
          (
            event: "console",
            listener: (message: {
              type: () => string;
              text: () => string;
            }) => void,
          ): unknown;
        };
        locator: (selector: string) => {
          click: () => Promise<void>;
          fill: (value: string) => Promise<void>;
          dispatchEvent: (event: string) => Promise<void>;
          screenshot: (options: { path: string }) => Promise<unknown>;
        };
        waitForTimeout: (milliseconds: number) => Promise<void>;
        close: () => Promise<void>;
      }>;
      close: () => Promise<void>;
    }>;
  };
}

/** Read-only public scene observations, not a substitute for independent geometry inspection. */
interface Inspection {
  prepared: boolean;
  admitted: boolean;
  implementedUntil: number;
  seconds: number;
  preparation: {
    completed: number;
    total: number;
    milliseconds: number;
    failedStates: unknown[];
  };
  camera: unknown;
  actors: unknown;
  fixedInputs?: unknown;
  rescue?: unknown;
  models?: unknown;
}

/** Hash every actual file in one owned source tree, retaining relative paths. */
async function sourceHashes(
  directory: string,
  prefix: string = "",
): Promise<Record<string, string>> {
  const rows: Record<string, string> = {};
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const relative: string = prefix + entry.name;
    const full: string = path.join(directory, entry.name);
    if (entry.isDirectory())
      Object.assign(rows, await sourceHashes(full, relative + "/"));
    else if (entry.isFile())
      rows[relative] = createHash("sha256")
        .update(await fs.readFile(full))
        .digest("hex");
  }
  return rows;
}

/**
 * Observe the actual prepared Viewer with durable progress and a bounded owned browser.
 *
 * @evidence contracts/common.md#implementation-and-ownership Uses the installed public Playwright driver and isolated Chrome. Source maps are saved before navigation; actual preparation starts once in the browser and is polled rather than held behind a long REPL transport request. All frame diagnostics, controls, screenshots and an actual Play recording are retained before admission assertions. Only this helper's browser closes; Vite and other owners remain untouched.
 * @evidence contracts/common.md#authoring-interface Run through ttsx with optional Viewer URL and production-contained output directory. Fourth argument --hold reserves CDP9523 and retains the prepared page until release-browser or30minutes. Optional fifth argument writes a v2 fixed playback bake containing the same original cached actor records, numerical inputs, exact source maps and observed admission; JSONL traces remain beside observations. No solver/model reruns or fake acceptance occur. Preparation has its own30-minute deadline and durable progress. Samples/recordings do not establish continuous watching, sound or whole-film acceptance.
 */
export async function inspectViewer(): Promise<void> {
  const productionRoot: string = fileURLToPath(new URL("../", import.meta.url));
  const requireInstalled: NodeJS.Require = createRequire(
    new URL("../../../../packages/human/package.json", import.meta.url),
  );
  const driver: BrowserDriver = requireInstalled(
    "playwright-core",
  ) as BrowserDriver;
  const output: string = path.resolve(
    productionRoot,
    process.argv[3] ?? ".cache/motion/viewer-inspection",
  );
  const relative: string = path.relative(productionRoot, output);
  if (relative.startsWith("..") || path.isAbsolute(relative))
    throw new Error("Inspection output must stay in this production");
  await fs.mkdir(output, { recursive: true });
  const before: object = {
    production: await sourceHashes(path.join(productionRoot, "src")),
    human: await sourceHashes(
      fileURLToPath(
        new URL("../../../../packages/human/src/", import.meta.url),
      ),
    ),
    engine: await sourceHashes(
      fileURLToPath(
        new URL("../../../../packages/engine/src/", import.meta.url),
      ),
    ),
    viewer: await sourceHashes(
      fileURLToPath(
        new URL("../../../../packages/viewer/src/", import.meta.url),
      ),
    ),
  };
  await fs.writeFile(
    path.join(output, "source-before.json"),
    JSON.stringify(before, null, 2),
  );
  const url: string = process.argv[2] ?? "http://127.0.0.1:5183/";
  const hold: boolean = process.argv[4] === "--hold";
  if (hold)
    await new Promise<void>(
      (resolve: () => void, reject: (error: Error) => void): void => {
        const probe: Server = createServer();
        probe.once("error", reject);
        probe.listen(9523, "127.0.0.1", (): void => {
          probe.close((error?: Error): void => {
            if (error) reject(error);
            else resolve();
          });
        });
      },
    );
  const browser: Awaited<ReturnType<BrowserDriver["chromium"]["launch"]>> =
    await driver.chromium.launch({
      executablePath: process.env.CHROME_PATH ?? DEFAULT_CHROME_EXECUTABLE,
      headless: true,
      timeout: 120000,
      ...(hold
        ? {
            args: [
              "--remote-debugging-address=127.0.0.1",
              "--remote-debugging-port=9523",
            ],
          }
        : {}),
    });
  const errors: string[] = [];
  const warnings: string[] = [];
  const observationFailures: string[] = [];
  let inspection: Inspection | undefined;
  let failure: string | undefined;
  try {
    const page: Awaited<ReturnType<typeof browser.newPage>> =
      await browser.newPage({ viewport: { width: 850, height: 1450 } });
    page.on("pageerror", (error: Error): void => {
      errors.push(error.stack ?? error.message);
    });
    page.on(
      "console",
      (message: { type: () => string; text: () => string }): void => {
        if (message.type() === "error") errors.push(message.text());
        else if (message.type() === "warning") warnings.push(message.text());
      },
    );
    const begun: number = performance.now();
    await page.goto(url, { timeout: 240000 });
    await page.evaluate((): void => {
      const prepare: unknown = Reflect.get(window, "__afPrepare");
      if (typeof prepare !== "function")
        throw new Error("Actual performance preparation port missing");
      void Promise.resolve(prepare()).catch((error: unknown): void => {
        console.error(error);
      });
    });
    let lastCompleted: number = -1;
    while (performance.now() - begun < 30 * 60 * 1000) {
      inspection = await page.evaluate((): Inspection => {
        const inspect: unknown = Reflect.get(window, "__duelInspection");
        if (typeof inspect !== "function")
          throw new Error("Actual inspection port missing");
        return inspect();
      });
      await fs.writeFile(
        path.join(output, "progress.json"),
        JSON.stringify(
          { wallMs: performance.now() - begun, inspection, errors, warnings },
          null,
          2,
        ),
      );
      if (inspection.preparation.completed !== lastCompleted) {
        console.log({
          completed: inspection.preparation.completed,
          total: inspection.preparation.total,
          failures: inspection.preparation.failedStates.length,
          wallMs: performance.now() - begun,
        });
        lastCompleted = inspection.preparation.completed;
      }
      if (inspection.prepared) break;
      if (errors.length > 0)
        throw new Error(
          "Actual preparation raised an error; durable progress is retained",
        );
      await page.waitForTimeout(1000);
    }
    if (!inspection?.prepared)
      throw new Error("Actual preparation exceeded its30-minute deadline");
    const readinessMs: number = performance.now() - begun;
    await fs.writeFile(
      path.join(output, "preparation.json"),
      JSON.stringify({ readinessMs, inspection, errors, warnings }, null, 2),
    );
    const states: object[] = [];
    const reverse: object[] = [];
    const count: number = Math.round(inspection.implementedUntil * 24);
    const bakeArgument: string | undefined = process.argv[5];
    if (bakeArgument !== undefined) {
      const bakePath: string = path.resolve(productionRoot, bakeArgument);
      const bakeRelative: string = path.relative(productionRoot, bakePath);
      if (bakeRelative.startsWith("..") || path.isAbsolute(bakeRelative))
        throw new Error("Playback bake must stay in this production");
      await fs.mkdir(path.dirname(bakePath), { recursive: true });
      const rawPath: string = path.join(output, "original-frame-traces.jsonl");
      const playback: Awaited<ReturnType<typeof fs.open>> = await fs.open(
        bakePath,
        "w",
      );
      const originals: Awaited<ReturnType<typeof fs.open>> = await fs.open(
        rawPath,
        "w",
      );
      try {
        const header: string = JSON.stringify({
          format: "look-at-me-duel-motion-bake-v2",
          fps: 24,
          durationSeconds: inspection.implementedUntil,
          admitted: inspection.admitted,
          source: before,
          models: inspection.models,
          observedViewerUrl: url,
          fixedInputs: inspection.fixedInputs ?? [],
          observations: { rescue: inspection.rescue ?? null },
        });
        await playback.writeFile(header.slice(0, -1) + ',"frames":[');
        for (let index: number = 0; index <= count; index++) {
          const original: Record<
            string,
            Record<string, unknown>
          > = await page.evaluate(
            (frame: number): Record<string, Record<string, unknown>> => {
              const read: unknown = Reflect.get(window, "__duelFrame");
              if (typeof read !== "function")
                throw new Error("Actual cached-frame port missing");
              return read(frame);
            },
            index,
          );
          await originals.writeFile(
            JSON.stringify({
              frame: index,
              seconds: index / 24,
              state: original,
            }) + "\n",
          );
          await playback.writeFile(
            (index === 0 ? "" : ",") + JSON.stringify(original),
          );
        }
        await playback.writeFile("]}\n");
      } finally {
        await playback.close();
        await originals.close();
      }

      /** Hash retained large bytes incrementally rather than return them through an MCP result. */
      async function digest(file: string): Promise<string> {
        const hash: ReturnType<typeof createHash> = createHash("sha256");
        for await (const chunk of createReadStream(file)) hash.update(chunk);
        return hash.digest("hex");
      }
      await fs.writeFile(
        path.join(output, "bake-receipt.json"),
        JSON.stringify(
          {
            bakePath,
            bytes: (await fs.stat(bakePath)).size,
            sha256: await digest(bakePath),
            originalTracePath: rawPath,
            originalTraceSha256: await digest(rawPath),
            fps: 24,
            durationSeconds: inspection.implementedUntil,
            preparedFramesIncludingEndpoint: count + 1,
            plannedEncodedFrames: count,
            admitted: inspection.admitted,
            status:
              "Actual cached source data; no final whole-film or soundtrack acceptance",
          },
          null,
          2,
        ),
      );
    }
    for (let frame: number = 0; frame <= count; frame++) {
      states.push(
        await page.evaluate(async (seconds: number): Promise<object> => {
          const seek: unknown = Reflect.get(window, "__afSeek");
          const inspect: unknown = Reflect.get(window, "__duelInspection");
          if (typeof seek !== "function" || typeof inspect !== "function")
            throw new Error("Actual motion ports missing");
          const begun: number = performance.now();
          await seek(seconds);
          const current: Inspection = inspect();
          return {
            seconds: current.seconds,
            camera: current.camera,
            actors: current.actors,
            milliseconds: performance.now() - begun,
          };
        }, frame / 24),
      );
    }
    for (let frame: number = count; frame >= 0; frame--) {
      reverse.push(
        await page.evaluate(async (seconds: number): Promise<object> => {
          const seek: unknown = Reflect.get(window, "__afSeek");
          const inspect: unknown = Reflect.get(window, "__duelInspection");
          if (typeof seek !== "function" || typeof inspect !== "function")
            throw new Error("Actual motion ports missing");
          await seek(seconds);
          const current: Inspection = inspect();
          return {
            seconds: current.seconds,
            camera: current.camera,
            actors: current.actors,
          };
        }, frame / 24),
      );
    }
    await fs.writeFile(
      path.join(output, "all-frame-states.json"),
      JSON.stringify({ states, reverse }),
    );
    const samples: number[] = [
      0, 1.8, 3.5833, 3.625, 5.9583, 6, 6.3, 6.7, 7.5, 8.9583, 9, 9.0417, 10.5,
      11.3, 12.7, 13.4, 14.6, 15.15, 16.3, 17.1, 17.4, 18.1, 18.8, 19.5, 20.2,
      22.3333, 23.3, 23.5, 24.125, 24.875, 25, 26.8, 28.6, 30.5, 33.2, 34.8,
      35.9, 36.2, 36.9, 37.7, 38.2, 39.1, 40, 40.5, 40.625, 40.875, 41.5, 42.2,
      44.4, 45.9, 48, 48.6, 49.7, 50.5, 52, 52.7, 53.2, 54.7, 55.4, 57.6, 58.5,
      59.7083, 59.75, 60,
    ];
    for (const seconds of samples.filter(
      (value: number): boolean => value <= inspection!.implementedUntil,
    )) {
      try {
        await page.evaluate(async (time: number): Promise<void> => {
          const seek: unknown = Reflect.get(window, "__afSeek");
          if (typeof seek !== "function")
            throw new Error("Actual completed seek port missing");
          await seek(time);
        }, seconds);
        await page
          .locator("#view")
          .screenshot({
            path: path.join(
              output,
              `pose-${String(seconds).replace(".", "-")}.png`,
            ),
          });
      } catch (error: unknown) {
        observationFailures.push(`Sample${seconds}: ${String(error)}`);
      }
    }
    await page.locator("#seek").fill("0");
    await page.locator("#seek").dispatchEvent("input");
    await page.evaluate((): void => {
      const canvas: Element | null = document.querySelector("#view");
      if (!(canvas instanceof HTMLCanvasElement))
        throw new Error("Actual scene canvas missing");
      const recorder: MediaRecorder = new MediaRecorder(
        canvas.captureStream(24),
        { mimeType: "video/webm;codecs=vp9" },
      );
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event: BlobEvent): void => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      Reflect.set(window, "__duelObserverRecording", { recorder, chunks });
      recorder.start();
    });
    await page.locator("#play").click();
    await page.waitForTimeout(inspection.implementedUntil * 1000 + 100);
    await page.locator("#pause").click();
    const recording: number[] = await page.evaluate(
      async (): Promise<number[]> => {
        const state: { recorder: MediaRecorder; chunks: Blob[] } = Reflect.get(
          window,
          "__duelObserverRecording",
        );
        await new Promise<void>((resolve: () => void): void => {
          state.recorder.onstop = (): void => resolve();
          state.recorder.stop();
        });
        const bytes: ArrayBuffer = await new Blob(state.chunks, {
          type: state.recorder.mimeType,
        }).arrayBuffer();
        return Array.from(new Uint8Array(bytes));
      },
    );
    await fs.writeFile(
      path.join(output, "actual-play.webm"),
      Buffer.from(recording),
    );
    const paused: string = await page.evaluate(
      (): string =>
        (document.querySelector("#clock") as HTMLOutputElement).value,
    );
    await page.waitForTimeout(350);
    const stable: string = await page.evaluate(
      (): string =>
        (document.querySelector("#clock") as HTMLOutputElement).value,
    );
    await page.locator("#seek").fill("7");
    await page.locator("#seek").dispatchEvent("input");
    const sought: string = await page.evaluate(
      (): string =>
        (document.querySelector("#clock") as HTMLOutputElement).value,
    );
    await fs.writeFile(
      path.join(output, "controls.json"),
      JSON.stringify(
        {
          paused,
          stable,
          sought,
          readinessMs,
          errors,
          warnings,
          url,
          scope:
            "Actual controls, all-frame diagnostics, sampled images and unwatched recording; no continuous watching or sound acceptance",
        },
        null,
        2,
      ),
    );
    if (hold) {
      await fs.writeFile(
        path.join(output, "browser-ready.json"),
        JSON.stringify(
          {
            cdp: "http://127.0.0.1:9523",
            url,
            output,
            prepared: inspection.prepared,
            admitted: inspection.admitted,
            observationFailures,
            scope:
              "Owned prepared candidate browser held for an independent reader; no motion acceptance",
          },
          null,
          2,
        ),
      );
      const held: number = performance.now();
      while (performance.now() - held < 30 * 60 * 1000) {
        try {
          await fs.access(path.join(output, "release-browser"));
          break;
        } catch {
          await page.waitForTimeout(1000);
        }
      }
    }
    if (paused !== stable || parseFloat(sought) !== 7 || errors.length !== 0)
      throw new Error("Actual Viewer controls failed; receipt is retained");
    if (observationFailures.length !== 0)
      throw new Error(
        "Some observations failed; all remaining samples were attempted and failures are retained",
      );
    console.log({
      prepared: inspection.prepared,
      admitted: inspection.admitted,
      total: inspection.preparation.total,
      failedStates: inspection.preparation.failedStates.length,
      readinessMs,
    });
    if (!inspection.admitted)
      throw new Error(
        "Actual motion has unresolved states; full original diagnostics are retained",
      );
  } catch (error: unknown) {
    failure =
      error instanceof Error ? (error.stack ?? error.message) : String(error);
    throw error;
  } finally {
    const after: object = {
      production: await sourceHashes(path.join(productionRoot, "src")),
      human: await sourceHashes(
        fileURLToPath(
          new URL("../../../../packages/human/src/", import.meta.url),
        ),
      ),
      engine: await sourceHashes(
        fileURLToPath(
          new URL("../../../../packages/engine/src/", import.meta.url),
        ),
      ),
      viewer: await sourceHashes(
        fileURLToPath(
          new URL("../../../../packages/viewer/src/", import.meta.url),
        ),
      ),
    };
    await fs.writeFile(
      path.join(output, "source-after.json"),
      JSON.stringify(after, null, 2),
    );
    await fs.writeFile(
      path.join(output, "outcome.json"),
      JSON.stringify(
        {
          sourceUnchanged: JSON.stringify(before) === JSON.stringify(after),
          failure,
          inspection,
          errors,
          warnings,
          observationFailures,
          url,
        },
        null,
        2,
      ),
    );
    await browser.close();
  }
}

await inspectViewer();
