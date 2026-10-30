import { frameTimes } from "@automovie/render";
import { DEFAULT_CHROME_EXECUTABLE } from "@automovie/render/node/chrome";
import { createViewerCaptureSession } from "@automovie/viewer/node";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { lstat, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { finished } from "node:stream/promises";
import { chromium, type Browser } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const repository = path.resolve(root, "../..");
const outputs = path.join(root, "public/outputs/episode-one");
const filmFile = path.join(root, "public/film.json");
const film = JSON.parse(await readFile(filmFile, "utf8"));
const probe = process.argv.includes("--probe");
const mode = probe ? "inspection" : "complete-capture";
if (process.argv.slice(2).some(argument => argument !== "--probe"))
  throw new Error("Only --probe is supported");

/**
 * A byte identity in a frozen input population or one run's emitted output.
 * @evidence contracts/common.md#implementation-and-ownership Actual saved bytes determine both size and SHA; paths are relative to their declared owner, not guessed from a timestamp.
 * @evidence contracts/common.md#authoring-interface Input paths are repository-relative and output paths run-relative, with forward slashes. Every entry identifies a regular file.
 */
interface FileIdentity { path: string; bytes: number; sha256: string }

/**
 * Resolve an owned relative file without permitting a path outside its base.
 * @evidence contracts/common.md#implementation-and-ownership All manifest references pass the same containment check before reads. This is a local run recorder, not an authorization mechanism for hostile concurrent filesystem replacement.
 * @evidence contracts/common.md#authoring-interface Relative paths must be nonempty and cannot escape base; URL paths must be converted by their actual caller first.
 */
function within(base: string, relative: string): string {
  if (!relative || path.isAbsolute(relative)) throw new Error(`Invalid relative path ${relative}`);
  const result = path.resolve(base, relative);
  const relation = path.relative(base, result);
  if (!relation || relation === ".." || relation.startsWith(`..${path.sep}`))
    throw new Error(`Path escapes its owner: ${relative}`);
  return result;
}

/**
 * Fingerprint a real regular file against its owner.
 * @evidence contracts/common.md#implementation-and-ownership Reads retained bytes and refuses a linked or non-file leaf rather than recording an unobserved target.
 * @evidence contracts/common.md#authoring-interface The caller supplies an already contained absolute file; returned path uses forward slashes relative to base.
 */
async function identify(base: string, file: string): Promise<FileIdentity> {
  if (!(await lstat(file)).isFile()) throw new Error(`Not a regular file: ${file}`);
  const bytes = await readFile(file);
  return { path: path.relative(base, file).split(path.sep).join("/"), bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex") };
}

/**
 * Rediscover every source and fixed media dependency used by this production.
 * @evidence contracts/common.md#implementation-and-ownership The population includes preparation and its local Python imports, original and selected take bytes/provenance, the canonical screenplay, actual mix, compiled capture host and source-linked public packages. Rediscovery after capture catches additions as well as changed bytes.
 * @evidence contracts/common.md#authoring-interface This repository-bound host records its actual public source-linked route. External installed tool versions remain observations, not copied source or a claim of reproducibility on unobserved systems.
 */
async function fingerprint(): Promise<FileIdentity[]> {
  const files = new Set([
    "index.html", "package.json", "tsconfig.json", "vite.config.ts", "vite.capture.config.ts",
    "scripts/capture.ts", "scripts/inspect-frames.py", "scripts/prepare-film.py",
    "scripts/episode_foley.py", "scripts/generate-speech.py", "public/film.json",
    "docs/body/screenplay/001-chronicle/001-road.md", "public/audio/001-road/takes.json",
    "public/audio/001-road/selection.json", ".capture/capture.mjs",
  ].map(file => within(root, file)));
  for (const directory of [path.join(root, "src"), ...["engine", "interface", "viewer", "render"].map(name => path.join(repository, "packages", name, "src"))])
    for (const file of await readdir(directory, { recursive: true }))
      if (/\.(?:ts|css)$/.test(file)) files.add(within(directory, file));
  // Follow local Python imports, including future helper modules used by preparation.
  const python = [within(root, "scripts/prepare-film.py")];
  const visited = new Set<string>();
  while (python.length) {
    const file = python.pop()!;
    if (visited.has(file)) continue;
    visited.add(file); files.add(file);
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(/^\s*(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))/gm)) {
      const module = (match[1] ?? match[2]!).replaceAll(".", path.sep);
      const dependency = within(path.dirname(file), `${module}.py`);
      const info = await lstat(dependency).catch(error => {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
        throw error;
      });
      if (info) python.push(dependency);
    }
  }
  const audio = within(root, "public/audio/001-road/takes.json");
  const takes = JSON.parse(await readFile(audio, "utf8"));
  for (const take of takes.takes) files.add(within(path.dirname(audio), take.file));
  const selection = JSON.parse(await readFile(within(root, "public/audio/001-road/selection.json"), "utf8"));
  for (const selected of selection.changes) {
    const wave = within(path.dirname(audio), selected.file);
    const provenance = within(root, selected.provenance);
    for (const [file, expected] of [[wave, selected.sha256], [provenance, selected.provenanceSha256]]) {
      const actual = await identify(repository, file);
      if (actual.sha256 !== expected) throw new Error(`Changed selected media/provenance ${actual.path}`);
      files.add(file);
    }
  }
  const currentFilm = JSON.parse(await readFile(filmFile, "utf8"));
  for (const cue of currentFilm.cues) if (cue.file) files.add(within(path.dirname(audio), cue.file));
  if (typeof currentFilm.audio !== "string" || !currentFilm.audio.startsWith("/") || currentFilm.audio.startsWith("//"))
    throw new Error("Film audio must name its local public asset");
  files.add(within(path.join(root, "public"), currentFilm.audio.slice(1)));
  files.add(within(repository, "pnpm-lock.yaml"));
  const identities = await Promise.all([...files].map(file => identify(repository, file)));
  // Code-unit order is shared exactly with the Python receipt reader.
  return identities.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
}

/**
 * Encode only this run's stream and release its exact child on every failure.
 * @evidence contracts/common.md#implementation-and-ownership Awaited writes preserve pipe backpressure. A capture, spawn, pipe or encoder failure destroys stdin, terminates this owned encoder and awaits close plus its log stream; unrelated processes are never touched.
 * @evidence contracts/common.md#authoring-interface The supplied session remains caller-owned. Output is one complete MP4 or retained failed-run evidence; a partial MP4 never receives a completion receipt.
 */
async function encode(
  session: Awaited<ReturnType<typeof createViewerCaptureSession>>,
  output: string,
  inspect: () => Promise<unknown>,
  observations: unknown[],
): Promise<void> {
  const ffmpeg = process.env.FFMPEG ?? "D:/github/samchon/.automovie-runtime/voxcpm/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe";
  const encoder = spawn(ffmpeg, ["-y", "-f", "image2pipe", "-vcodec", "png", "-framerate", String(film.fps), "-i", "pipe:0",
    "-i", within(path.join(root, "public"), film.audio.slice(1)), "-map", "0:v:0", "-map", "1:a:0", "-c:v", "libx264",
    "-preset", "fast", "-crf", "19", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
    path.join(output, "the-road-gives-way.mp4")], { stdio: ["pipe", "ignore", "pipe"] });
  let failure: Error | undefined;
  let closed = false;
  const completion = new Promise<{code: number | null; signal: NodeJS.Signals | null}>(resolve => {
    encoder.once("error", error => { failure = error; });
    encoder.once("close", (code, signal) => { closed = true; resolve({ code, signal }); });
  });
  const log = createWriteStream(path.join(output, "encode.log"));
  const logCompletion = finished(log).then(() => undefined, error => error as Error);
  encoder.stderr.pipe(log);
  encoder.stdin.on("error", error => { failure = error; });
  let problem: unknown;
  try {
    const schedule = frameTimes(film.fps, film.duration);
    if (schedule.length !== film.frames) throw new Error("Film frame count differs from the public schedule");
    let frame = 0;
    for (const time of schedule) {
      if (failure) throw failure;
      if (closed) throw new Error("Encoder closed before capture completed");
      await session.capture(time, async (_pass, bytes) => {
        await new Promise<void>((resolve, reject) => encoder.stdin.write(bytes, error => error ? reject(error) : resolve()));
      });
      if (frame % 240 === 0) {
        observations.push(await inspect());
        console.log(JSON.stringify({ frame, total: schedule.length, time }));
      }
      frame++;
    }
    encoder.stdin.end();
    const result = await completion;
    const logError = await logCompletion;
    if (failure) throw failure;
    if (logError) throw logError;
    if (result.code !== 0) throw new Error(`Encoder exited ${result.code} (${result.signal})`);
    await writeFile(path.join(output, "capture-observations.json"), JSON.stringify({ frames: frame, observations, completed: true }, null, 2));
  } catch (error) { problem = error; }
  finally {
    if (!closed) {
      encoder.stdin.destroy();
      encoder.kill();
      await completion;
    }
    // stderr normally ends the piped log; explicitly close it after a spawn failure too.
    if (!log.writableEnded && !log.destroyed) log.end();
    const logError = await logCompletion;
    if (logError) problem = problem ? new AggregateError([problem, logError], "Capture and log cleanup failed") : logError;
  }
  if (problem) throw problem;
}

await mkdir(outputs, { recursive: true });
const inputs = await fingerprint();
const runtimeIdentity = createHash("sha256").update(JSON.stringify(inputs)).digest("hex");
const run = `${new Date().toISOString().replace(/[:.]/g, "-")}-${runtimeIdentity.slice(0, 12)}-${randomUUID().slice(0, 8)}`;
const output = path.join(outputs, "runs", run);
await mkdir(output, { recursive: false });
const frozenFilm = inputs.find(file => file.path === path.relative(repository, filmFile).split(path.sep).join("/"))!;
const baseline = JSON.stringify({ schemaVersion: 2, mode, run, runtimeIdentity, inputs, film: frozenFilm,
  profile: { width: film.width, height: film.height, fps: film.fps, frames: film.frames, duration: film.duration }, audioAcceptance: "candidate-unheard" }, null, 2);
await writeFile(path.join(output, "baseline.json"), baseline, { flag: "wx" });
const errors: string[] = [];
const served: {url: string; bytes: number; sha256: string; resourceType: string}[] = [];
const pending: Promise<void>[] = [];
try {
  let browser: Browser | undefined;
  let session: Awaited<ReturnType<typeof createViewerCaptureSession>> | undefined;
  let problem: unknown;
  try {
    browser = await chromium.launch({ executablePath: DEFAULT_CHROME_EXECUTABLE, headless: true,
      args: ["--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-webgl"] });
    const page = await browser.newPage({ viewport: { width: film.width, height: film.height }, deviceScaleFactor: 1 });
    page.on("response", response => {
      const resourceType = response.request().resourceType();
      if (resourceType === "script" || resourceType === "stylesheet" || new URL(response.url()).pathname === "/film.json")
        pending.push(response.body().then(bytes => {
          served.push({ url: response.url(), bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), resourceType });
        }).catch(error => { errors.push(`Response body ${response.url()}: ${String(error)}`); }));
    });
    page.on("pageerror", error => errors.push(error.message));
    session = await createViewerCaptureSession({ page, url: "http://127.0.0.1:5187/?capture", passes: ["beauty"], hideSelector: null });
    await page.waitForFunction(() => Reflect.get(window, "__afReady") === true);
    const inspect = async () => ({ runtimeIdentity, ...await page.evaluate(() => Reflect.get(window, "__afInspect")()) });
    const observations: unknown[] = [];
    if (probe) {
      const hashes = new Map<number, string>();
      for (const shot of film.shots)
        for (const [label, local] of [["entry", 0], ["middle", Math.min(4, shot.duration / 2)], ["exit", shot.duration - 1 / film.fps]] as const) {
          const time = shot.start + local;
          await session.capture(time, async (_pass, bytes) => {
            await writeFile(path.join(output, `probe-${shot.id}-${label}.png`), bytes, { flag: "wx" });
            hashes.set(time, createHash("sha256").update(bytes).digest("hex"));
          });
          observations.push({ ...await inspect(), sample: label });
        }
      const replay = [];
      for (const shot of [...film.shots].reverse()) {
        const time = shot.start + Math.min(4, shot.duration / 2);
        let hash = "";
        await session.capture(time, async (_pass, bytes) => { hash = createHash("sha256").update(bytes).digest("hex"); });
        replay.push({ shot: shot.id, time, identical: hash === hashes.get(time) });
      }
      const ui = await browser.newPage({ viewport: { width: 1440, height: 1040 } });
      ui.on("pageerror", error => errors.push(error.message));
      await ui.goto("http://127.0.0.1:5187/");
      await ui.bringToFront();
      await ui.waitForFunction(() => Reflect.get(window, "__afReady") === true);
      await ui.locator("#play").click();
      await ui.waitForFunction(() => Reflect.get(window, "__afInspect")().time > .2, null, { timeout: 20000 });
      const playing = await ui.evaluate(() => ({ time: Reflect.get(window, "__afInspect")().time, paused: (document.getElementById("audio") as HTMLAudioElement).paused }));
      await ui.locator("#play").click();
      const paused = await ui.evaluate(() => Reflect.get(window, "__afInspect")().time);
      await ui.waitForTimeout(250);
      const held = await ui.evaluate(() => Reflect.get(window, "__afInspect")().time);
      await ui.locator("#seek").focus(); await ui.keyboard.press("End");
      const seekEnd = await ui.evaluate(() => Reflect.get(window, "__afInspect")());
      await ui.locator("#orbit").focus(); await ui.keyboard.press("Home");
      const orbit = await ui.evaluate(() => Reflect.get(window, "__afInspect")());
      await ui.locator("#reset").click();
      const reset = await ui.evaluate(() => Reflect.get(window, "__afInspect")());
      await ui.screenshot({ path: path.join(output, "viewer-controls.png") });
      await ui.close();
      await writeFile(path.join(output, "probe-observations.json"), JSON.stringify({ observations, replay,
        controls: { playing, paused, held, seekEnd, orbit, reset }, errors }, null, 2), { flag: "wx" });
      if (replay.some(item => !item.identical)) throw new Error("History-dependent rendered seek detected");
      if (playing.paused || playing.time <= 0 || paused !== held || seekEnd.time < (film.frames - 2) / film.fps)
        throw new Error("Interactive playback controls failed");
    } else await encode(session, output, inspect, observations);
    await Promise.all(pending);
    if (!served.some(file => new URL(file.url).pathname === "/film.json" && file.sha256 === frozenFilm.sha256))
      throw new Error("The browser did not consume the frozen film bytes");
    if (errors.length) throw new Error(errors.join("\n"));
  } catch (error) { problem = error; }
  finally {
    const cleanup: unknown[] = [];
    if (session) try { await session.close(); } catch (error) { cleanup.push(error); }
    if (browser) try { await browser.close(); } catch (error) { cleanup.push(error); }
    if (cleanup.length) problem = new AggregateError(problem ? [problem, ...cleanup] : cleanup, "Capture cleanup failed");
  }
  if (problem) throw problem;
  if (JSON.stringify(await fingerprint()) !== JSON.stringify(inputs))
    throw new Error("Runtime input population or bytes changed during this run");
  const inventory: FileIdentity[] = [];
  for (const entry of await readdir(output, { withFileTypes: true })) {
    if (entry.name === "baseline.json") continue;
    if (!entry.isFile()) throw new Error(`Unexpected capture output ${entry.name}`);
    inventory.push(await identify(output, path.join(output, entry.name)));
  }
  inventory.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  const expectedImages = film.shots.length * 3 + 1;
  if (probe ? inventory.filter(file => file.path.endsWith(".png")).length !== expectedImages
    : !inventory.some(file => file.path === "the-road-gives-way.mp4" && file.bytes > 0))
    throw new Error("Incomplete emitted media population");
  await writeFile(path.join(output, "completed.json"), JSON.stringify({ schemaVersion: 2, mode, run, runtimeIdentity,
    baselineSha256: createHash("sha256").update(baseline).digest("hex"), filmSha256: frozenFilm.sha256,
    outputs: inventory, served, errors, completed: true }, null, 2), { flag: "wx" });
  await writeFile(path.join(outputs, "latest.json"), JSON.stringify({ run, runtimeIdentity,
    path: path.relative(root, output).split(path.sep).join("/"), kind: mode }, null, 2));
  console.log(JSON.stringify({ run, runtimeIdentity, output }));
} catch (error) {
  await writeFile(path.join(output, "failed.json"), JSON.stringify({ schemaVersion: 2, mode, run, runtimeIdentity,
    error: String(error), errors }, null, 2), { flag: "wx" });
  throw error;
}
