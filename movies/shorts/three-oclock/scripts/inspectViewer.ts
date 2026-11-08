import { DEFAULT_CHROME_EXECUTABLE } from "@automovie/render/node/chrome";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Installed public Playwright operations used by this durable observer. */
interface Driver {
  chromium: { launch: (options: { executablePath: string; headless: boolean; timeout: number; args?: string[] }) => Promise<{
    newPage: (options: { viewport: { width: number; height: number } }) => Promise<{
      goto: (url: string, options: { timeout: number }) => Promise<unknown>;
      evaluate: { <T>(task: () => T): Promise<Awaited<T>>; <T, A>(task: (argument: A) => T, argument: A): Promise<Awaited<T>> };
      on: { (event: "pageerror", listener: (error: Error) => void): unknown; (event: "console", listener: (message: { type: () => string; text: () => string }) => void): unknown };
      locator: (selector: string) => { click: (options?: { position: { x: number; y: number } }) => Promise<void>; fill: (value: string) => Promise<void>; dispatchEvent: (event: string) => Promise<void>; screenshot: (options: { path: string }) => Promise<unknown>; boundingBox: () => Promise<{ x: number; y: number; width: number; height: number } | null> };
      waitForTimeout: (milliseconds: number) => Promise<void>;
    }>;
    close: () => Promise<void>;
  }> };
}

/** Observer-owned completion receipt; this does not change host readiness. */
interface Preparation { state: "running" | "admitted" | "refused"; started: number; elapsedMs?: number; error?: string; }
/** Read-only public motion subset; complete raw returned objects are retained. */
interface Motion { frame: number; root?: { translation: number[] }; status: string; armError: number; harry: { root?: { translation: number[] }; status: string; armError: number }; interaction: { calibrated: boolean; event?: { time: number; progress: number }; release?: { time: number; contactSeconds: number }; departure?: { acquisition?: { time: number }; transfer?: { time: number } } }; }

/** Preserve every original byte identity without compiling another body. */
async function hashes(directory: string, prefix: string = ""): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const relative: string = prefix + entry.name; const full: string = path.join(directory, entry.name);
    if (entry.isDirectory()) Object.assign(result, await hashes(full, relative + "/"));
    else if (entry.isFile()) result[relative] = createHash("sha256").update(await fs.readFile(full)).digest("hex");
  }
  return result;
}

/**
 * Observe the actual production outside the REPL's300-second transport lifetime.
 *
 * @evidence contracts/common.md#implementation-and-ownership Adapts the successfully consumed Duel observer's installed public Playwright/isolated Chrome route. Starts the existing public preparation once, polls its observer-owned outcome, and writes durable progress before collecting all frames, reverse replay, critical images and actual controls. It records refusal without substituting a new rig or changing a scene/guard/solver. Only its owned browser is closed. Source and Human maps bracket the actual observations.
 * @evidence contracts/common.md#authoring-interface Run through ttsx with Viewer URL and a production-contained output directory. Optional --hold reserves owned loopback CDP9537 and keeps this exact page for30minutes or until release-browser exists. Preparation has a30-minute process deadline independent of tool transport. Failed readiness skips normal Play but still preserves diagnostic seeks; samples and unwatched recordings never claim continuous watching, accepted sound or a completed MP4.
 */
export async function inspectViewer(): Promise<void> {
  const root: string = fileURLToPath(new URL("../", import.meta.url));
  const output: string = path.resolve(root, process.argv[3] ?? ".cache/motion-shared-reach/durable-viewer");
  const relative: string = path.relative(root, output);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Observer output must remain in this production");
  await fs.mkdir(output, { recursive: true });
  const save: (name: string, value: unknown) => Promise<void> = async (name: string, value: unknown): Promise<void> => fs.writeFile(path.join(output, name), JSON.stringify(value, null, 2));
  const source: () => Promise<object> = async (): Promise<object> => ({ production: await hashes(path.join(root, "src")), human: await hashes(fileURLToPath(new URL("../../../../packages/human/src/", import.meta.url))) });
  const before: object = await source(); await save("source-before.json", before);
  const url: string = process.argv[2] ?? "http://127.0.0.1:5187/?start=36&end=48&w=720&h=1280";
  const hold: boolean = process.argv[4] === "--hold";
  if (hold) await new Promise<void>((resolve: () => void, reject: (error: Error) => void): void => {
    const probe: ReturnType<typeof createServer> = createServer(); probe.once("error", reject);
    probe.listen(9537, "127.0.0.1", (): void => { probe.close((error?: Error): void => { if (error) reject(error); else resolve(); }); });
  });
  const installed: NodeJS.Require = createRequire(new URL("../../../../packages/human/package.json", import.meta.url));
  const driver: Driver = installed("playwright-core") as Driver;
  const browser: Awaited<ReturnType<Driver["chromium"]["launch"]>> = await driver.chromium.launch({ executablePath: process.env.CHROME_PATH ?? DEFAULT_CHROME_EXECUTABLE, headless: true, timeout: 120000,
    ...(hold ? { args: ["--remote-debugging-address=127.0.0.1", "--remote-debugging-port=9537"] } : {}) });
  const errors: string[] = []; const warnings: string[] = []; const failures: string[] = [];
  let completion: Preparation | undefined; let finalFailure: string | undefined;
  try {
    const page: Awaited<ReturnType<typeof browser.newPage>> = await browser.newPage({ viewport: { width: 900, height: 1450 } });
    page.on("pageerror", (error: Error): void => { errors.push(error.stack ?? error.message); });
    page.on("console", (message): void => { if (message.type() === "error") errors.push(message.text()); else if (message.type() === "warning") warnings.push(message.text()); });
    const begun: number = performance.now();
    await save("started.json", { url, observerPid: process.pid, hold, source: "Same frozen production; no source/guard changes" });
    await page.goto(url, { timeout: 240000 });
    const duration: number = await page.evaluate((): number => Number((document.querySelector("#seek") as HTMLInputElement).max));
    await page.evaluate((): void => {
      const prepare: unknown = Reflect.get(window, "__afPrepare");
      if (typeof prepare !== "function") throw new Error("Actual public preparation hook missing");
      const state: Preparation = { state: "running", started: performance.now() };
      Reflect.set(window, "__threeOClockObserverPreparation", state);
      void Promise.resolve(prepare()).then((): void => { state.state = "admitted"; state.elapsedMs = performance.now() - state.started; }).catch((error: unknown): void => {
        state.state = "refused"; state.elapsedMs = performance.now() - state.started; state.error = error instanceof Error ? error.stack ?? error.message : String(error);
      });
    });
    while (performance.now() - begun < 30 * 60 * 1000) {
      const progress: { completion: Preparation; status: string | null } = await page.evaluate((): { completion: Preparation; status: string | null } => ({ completion: Reflect.get(window, "__threeOClockObserverPreparation"), status: document.querySelector("#preparation")?.textContent ?? null }));
      completion = progress.completion;
      await save("progress.json", { wallMs: performance.now() - begun, ...progress, errors, warnings });
      console.log({ state: completion.state, status: progress.status?.slice(0, 100), wallMs: Math.round(performance.now() - begun) });
      if (completion.state !== "running") break;
      await page.waitForTimeout(2000);
    }
    if (completion?.state === "running" || completion === undefined) throw new Error("Actual preparation has no outcome within30minutes");
    await save("preparation.json", { completion, errors, warnings, duration });
    const frames: { frame: number; motion?: Motion; error?: string }[] = [];
    const reverse: { frame: number; motion?: Motion; error?: string }[] = [];
    for (const direction of [1, -1]) for (let index: number = 0; index <= duration * 24; index++) {
      const frame: number = direction === 1 ? index : duration * 24 - index;
      try {
        const motion: Motion = await page.evaluate((seconds: number): Motion => {
          const seek: unknown = Reflect.get(window, "__afSeek"); const inspect: unknown = Reflect.get(window, "__afMotion");
          if (typeof seek !== "function" || typeof inspect !== "function") throw new Error("Actual scene ports missing");
          seek(seconds); return inspect();
        }, frame / 24);
        (direction === 1 ? frames : reverse).push({ frame, motion });
      } catch (error) { const message: string = String(error); (direction === 1 ? frames : reverse).push({ frame, error: message }); failures.push(`Frame${frame} direction${direction}:${message}`); }
    }
    await save("all-frame-states.json", { frames, reverse });
    const replayMismatches: number[] = frames.filter((row, index): boolean => JSON.stringify(row) !== JSON.stringify(reverse[frames.length - 1 - index])).map((row): number => row.frame);
    const samples: Set<number> = new Set([0, 1.5, 4.25, 6, 11, 13, 14, 18, 19, 23.3, 25, 25.7, 26.2, 26.75, 29, 31.8, 32.6, 34, 36, 36.25, 36.5, 37, 37.1667, 37.2083, 37.25, 37.4, 37.6, 37.8, 38, 38.2, 38.6, 39, 39.5, 40, 40.5, 41, 41.5, 42, 42.5, 43.3, 43.7, 44, 44.3, 44.75, 45.25, 45.3, 46, 46.2, 46.7, 47.2, 47.7, 48]);
    const event: Motion["interaction"] | undefined = frames.find((row): boolean => row.motion?.interaction.calibrated === true)?.motion?.interaction;
    for (const time of [event?.event?.time, event?.release?.time, event?.release === undefined ? undefined : event.release.time + event.release.contactSeconds])
      if (time !== undefined) for (const offset of [-1 / 24, 0, 1 / 24, 0.25]) samples.add(Math.max(0, time + offset));
    for (const frame of [124, 1127, 1128, 1129]) if (frame / 24 <= duration) samples.add(frame / 24);
    for (let frame: number = 1108; frame <= 1146 && frame / 24 <= duration; frame++) samples.add(frame / 24);
    for (const time of [48.25, 48.5, 48.75, 48.9, 49, 49.125, 49.25, 49.5, 49.75, 50, 50.4, 50.5, 51, 51.5, 51.8, 52, 52.125, 52.1667, 52.2, 52.3, 52.5, 52.7, 53, 53.5, 54, 54.9, 55.1, 55.5, 56, 56.2, 56.8, 57, 57.74, 58, 58.4, 59, 59.6, 59.95, 60]) if (time <= duration) samples.add(time);
    for (const person of ["carina", "harry"] as const) {
      const steps: { frame: number; distance: number }[] = [];
      for (let index: number = 1153; index < frames.length; index++) {
        const first: Motion | Motion["harry"] | undefined = person === "carina" ? frames[index - 1]?.motion : frames[index - 1]?.motion?.harry;
        const second: Motion | Motion["harry"] | undefined = person === "carina" ? frames[index]?.motion : frames[index]?.motion?.harry;
        if (first?.root !== undefined && second?.root !== undefined) steps.push({ frame: index, distance: Math.hypot(...second.root.translation.map((value: number, axis: number): number => value - first.root!.translation[axis]!)) });
      }
      for (const step of steps.sort((a: { frame: number; distance: number }, b: { frame: number; distance: number }): number => b.distance - a.distance).slice(0, 6))
        for (const offset of [-1, 0, 1]) samples.add(Math.max(0, Math.min(duration, (step.frame + offset) / 24)));
    }
    const finalDeparture: Motion["interaction"]["departure"] | undefined = frames.at(-1)?.motion?.interaction.departure;
    for (const time of [finalDeparture?.acquisition?.time, finalDeparture?.transfer?.time]) if (time !== undefined)
      for (const offset of [-1 / 24, 0, 1 / 24, 0.25]) samples.add(Math.max(0, Math.min(duration, time + offset)));
    const sampleImages: { requestedSeconds: number; frame: number; file: string }[] = [];
    for (const seconds of [...samples].filter((time: number): boolean => time <= duration).sort((a: number, b: number): number => a - b)) {
      const frame: number = Math.floor(seconds * 24 + 1e-7);
      const file: string = `pose-${String(sampleImages.length).padStart(3, "0")}-f${frame}-${String(seconds).replace(".", "-")}.png`;
      try { await page.evaluate((time: number): void => { Reflect.get(window, "__afSeek")(time); }, seconds); await page.locator("#view").screenshot({ path: path.join(output, file) }); sampleImages.push({ requestedSeconds: seconds, frame, file }); }
      catch (error) { failures.push(`Image${seconds}:${String(error)}`); }
    }
    await save("sample-images.json", sampleImages);
    const strideDirectory: string = path.join(output, "stride20");
    await fs.mkdir(strideDirectory, { recursive: true });
    const endFrame: number = Math.floor(duration * 24);
    const strideFrames: number[] = [...new Set([...Array.from({ length: Math.floor(endFrame / 20) + 1 }, (_: unknown, index: number): number => index * 20), endFrame, Math.max(0, endFrame - 1)])].sort((a: number, b: number): number => a - b);
    const strideImages: { requestedFrame: number; actualFrame: number; seconds: number; file: string; bytes: number; sha256: string }[] = [];
    for (const frame of strideFrames) {
      const file: string = `frame-${String(frame).padStart(4, "0")}.png`;
      try {
        const actual: Motion = await page.evaluate((seconds: number): Motion => { Reflect.get(window, "__afSeek")(seconds); return Reflect.get(window, "__afMotion")(); }, frame / 24);
        const imagePath: string = path.join(strideDirectory, file);
        await page.locator("#view").screenshot({ path: imagePath });
        const bytes: Buffer = await fs.readFile(imagePath);
        strideImages.push({ requestedFrame: frame, actualFrame: actual.frame, seconds: frame / 24, file, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") });
      } catch (error) { failures.push(`Stride20 frame${frame}:${String(error)}`); }
    }
    await fs.writeFile(path.join(strideDirectory, "manifest.json"), JSON.stringify({ sourceMaps: "../source-before.json", completion, fps: 24, stride: 20, scope: "Actual Viewer pixels at every twentieth frame, encoded last-frame candidate and scene endpoint; sampled, not continuous sensory watching", images: strideImages }, null, 2));
    let controls: object = { normalPlay: "Skipped: actual readiness refused" };
    if (completion.state === "admitted") {
      const params: URLSearchParams = new URL(url).searchParams; const start: number = Number(params.get("start") ?? 0); const end: number = Number(params.get("end") ?? duration);
      await page.locator("#seek").fill(String(start)); await page.locator("#seek").dispatchEvent("input");
      await page.evaluate((): void => {
        const canvas: HTMLCanvasElement = document.querySelector("#view") as HTMLCanvasElement;
        const recorder: MediaRecorder = new MediaRecorder(canvas.captureStream(24), { mimeType: "video/webm;codecs=vp9" }); const chunks: Blob[] = [];
        recorder.ondataavailable = (event: BlobEvent): void => { if (event.data.size > 0) chunks.push(event.data); }; Reflect.set(window, "__threeOClockObserverRecording", { recorder, chunks }); recorder.start();
      });
      await page.locator("#play").click(); await page.waitForTimeout((end - start) * 1000 + 800); await page.locator("#pause").click();
      const recording: number[] = await page.evaluate(async (): Promise<number[]> => {
        const state: { recorder: MediaRecorder; chunks: Blob[] } = Reflect.get(window, "__threeOClockObserverRecording");
        await new Promise<void>((resolve: () => void): void => { state.recorder.onstop = (): void => resolve(); state.recorder.stop(); });
        return Array.from(new Uint8Array(await new Blob(state.chunks, { type: state.recorder.mimeType }).arrayBuffer()));
      });
      await fs.writeFile(path.join(output, "actual-play.webm"), Buffer.from(recording));
      const paused: string = await page.evaluate((): string => (document.querySelector("#clock") as HTMLOutputElement).value);
      await page.waitForTimeout(350); const held: string = await page.evaluate((): string => (document.querySelector("#clock") as HTMLOutputElement).value);
      const slider: ReturnType<typeof page.locator> = page.locator("#seek"); const box: Awaited<ReturnType<typeof slider.boundingBox>> = await slider.boundingBox();
      if (box === null) throw new Error("Actual slider has no box");
      await slider.click({ position: { x: 8 + (box.width - 16) * 7 / duration, y: box.height / 2 } });
      const sought: string = await page.evaluate((): string => (document.querySelector("#clock") as HTMLOutputElement).value);
      controls = { start, end, paused, held, sought, scope: "Actual controls/time and unwatched recording; no continuous sensory watch or sound acceptance" };
      if (paused !== held || parseFloat(sought) !== 7 || parseFloat(paused) !== end) failures.push("Actual controls did not reach/hold/seek their promised values");
    }
    await save("controls.json", controls);
    const after: object = await source(); await save("source-after.json", after);
    const summary: object = { completion, duration, frameCount: frames.length, reverseCount: reverse.length, replayMismatches,
      unresolved: frames.filter((row): boolean => row.motion !== undefined && (row.motion.status !== "admitted" || row.motion.harry.status !== "admitted" || row.motion.armError > 0.003 || row.motion.harry.armError > 0.003)).map((row): number => row.frame),
      sourceUnchanged: JSON.stringify(before) === JSON.stringify(after), errors, warnings, failures, url, observerPid: process.pid, scope: "Actual declared segment observation; not final video acceptance" };
    await save("summary.json", summary); console.log({ saved: output, state: completion.state, frames: frames.length, replayMismatches: replayMismatches.length, consoleErrors: errors.length, observationFailures: failures.length });
    if (hold) {
      await save("browser-ready.json", { cdp: "http://127.0.0.1:9537", url, output, completion, observerPid: process.pid });
      const held: number = performance.now();
      while (performance.now() - held < 30 * 60 * 1000) { try { await fs.access(path.join(output, "release-browser")); break; } catch { await page.waitForTimeout(1000); } }
    }
    if (completion.state !== "admitted" || errors.length !== 0 || failures.length !== 0 || replayMismatches.length !== 0 || JSON.stringify(before) !== JSON.stringify(after)) throw new Error("Actual round has unresolved findings; complete receipts retained");
  } catch (error) { finalFailure = error instanceof Error ? error.stack ?? error.message : String(error); throw error; }
  finally { await save("outcome.json", { completion, finalFailure, errors, warnings, failures, url }); await browser.close(); }
}

await inspectViewer();
