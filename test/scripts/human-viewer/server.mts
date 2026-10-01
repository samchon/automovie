/**
 * Loopback-only resident GPU server, started as an attached session job:
 * `pnpm exec ttsx -P scripts/human-viewer/tsconfig.json scripts/human-viewer/server.mts`.
 * Vite transforms working-tree source; one real Chromium page serializes
 * capture requests. Numerical disk payloads and PID ownership live under the
 * ignored .shots tree. The host never edits documents or anatomical source.
 * Last-good PNGs retain their source identity; HTTP failures include a cause.
 */
import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type Page, chromium } from "playwright";
import { PNG } from "pngjs";
import { createServer } from "vite";

import { HumanViewerQueueFullError } from "./HumanViewerQueueFullError";
import { createHumanViewerSource } from "./createHumanViewerSource.mjs";
import type { IHumanViewerPhases } from "./IHumanViewerPhases";
import { judgeViewerRenderer } from "./judgeViewerRenderer";
import type { HumanViewerAddress } from "./HumanViewerAddress";
import { applyHumanViewerPose } from "./applyHumanViewerPose";
import { composeHumanViewerPixels } from "./composeHumanViewerPixels";
import { createHumanViewerQueue } from "./createHumanViewerQueue";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress";
import { humanViewerThumbnailFile } from "./humanViewerThumbnailFile";
import { openHumanViewerHref } from "./openHumanViewerHref";
import { planHumanViewerSheet } from "./planHumanViewerSheet";
import { readHumanViewerCapture } from "./readHumanViewerCapture.mjs";
import { renderHumanViewerSheet } from "./renderHumanViewerSheet.mjs";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress";
import { serveHumanViewerData } from "./serveHumanViewerData.mjs";
import { warmHumanViewerDocuments } from "./warmHumanViewerDocuments";
import { publishedHumanViewerWarmDocuments } from "./publishedHumanViewerWarmDocuments";
import { readHumanViewerWork } from "./readHumanViewerWork";
import { createHumanViewerCaptureLifetime } from "./createHumanViewerCaptureLifetime";
import { readHumanViewerCompilationStatus } from "./readHumanViewerCompilationStatus";
import { subscribeHumanViewerSources } from "./subscribeHumanViewerSources";
import { createHumanViewerWarmReadiness } from "./createHumanViewerWarmReadiness";
import { describeHumanViewerCapture } from "./describeHumanViewerCapture";

const directory = path.dirname(fileURLToPath(import.meta.url));
const source = createHumanViewerSource(directory);
const { root, storage, basisFiles, inputsDirectory, revisions, catalogue } = source;
let inventory = catalogue();
let page: Page;
let renderer = "";
let errors: string[] = [];
let readyRevision = "";
let sourceUpdating = false;
let work: ReturnType<typeof readHumanViewerWork> = null;
const lifetime = createHumanViewerCaptureLifetime();
const warmReadiness = createHumanViewerWarmReadiness((revision) => { void warm(revision); });
/** Requests allowed to wait behind the running one before a new one is refused. */
const QUEUE_LIMIT = 12;
const queue = createHumanViewerQueue({
  limit: QUEUE_LIMIT,
  patience: 3,
  now: () => performance.now(),
});
/** The last edit that reached a build, and the edit still waiting for its first frame. */
let lastEdit: { files: string[]; at: string; moved: string[] } | null = null;
let pendingEditAt: number | null = null;
let phases: IHumanViewerPhases = {};
let lastRender: {
  doc: string;
  ms: number;
  build: "cache" | "built";
  sinceEditMs: number | null;
  phases: IHumanViewerPhases;
} | null = null;
const lastBuild: Record<string, { doc: string; ms: number } | undefined> = {};
/** Every numerical build this server saw, by document, so a saving can be measured. */
const builds: Record<string, { ms: number; ao: boolean; at: string }> = {};
const warming = { revision: "", total: 0, done: 0, skipped: 0, current: null as string | null };
/** What the compile process last reported, read from the file it writes. */
const sourceStatus = () => readHumanViewerCompilationStatus(() =>
  fs.readFileSync(path.join(storage, "source-status.json"), "utf8"));
async function capture(address: HumanViewerAddress): Promise<Buffer> {
  if (!judgeViewerRenderer(renderer).real)
    throw new Error("A real GPU is required: " + renderer);
  // A broken working tree never stops the last good build from being drawn:
  // the frame says which build it came from and the source error stands beside it.
  const selectedRevision = readyRevision === "" ? inventory.revision : readyRevision;
  const started = performance.now();
  const result = await lifetime.run(() => readHumanViewerCapture(page, address, selectedRevision));
  const waited = result.waited;
  if (readyRevision !== selectedRevision)
    throw new Error(
      "Source changed during capture; the mixed revision was discarded",
    );
  const decoded = performance.now();
  const bytes = Buffer.from(result.png.split(",")[1], "base64");
  const reading = describeHumanViewerCapture({
    doc: address.doc, ao: address.ao, built: result.built, buildMs: result.buildMs,
    showMs: result.showMs, pngMs: result.pngMs, started, waited, decoded,
    finished: performance.now(), wallTime: Date.now(), pendingEditAt,
  });
  phases = reading.phases;
  const domain = inventory.documents.find((entry) => entry.id === address.doc)?.domain;
  if (reading.lastBuild !== null && reading.build !== null && domain !== undefined) {
    lastBuild[domain] = reading.lastBuild;
    builds[address.doc] = reading.build;
  }
  lastRender = reading.lastRender;
  pendingEditAt = null;
  return bytes;
}
const thumbnailFile = (search: string): string | null =>
  humanViewerThumbnailFile(search, storage, inventory);
/**
 * Build every published document that has no numerical result on disk yet, at
 * the lowest priority, so the first person or script to ask for one finds it
 * built. Each document is its own queue entry: a request in a higher lane
 * starts as soon as the one running finishes. A new source revision ends the
 * pass, which the page reload restarts.
 */
async function writeThumbnail(file: string, png: Buffer): Promise<void> {
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  await fs.promises.writeFile(file + ".tmp", png);
  await fs.promises.rename(file + ".tmp", file);
}
async function warm(revision: string): Promise<void> {
  const thumbnail = (id: string): string =>
    openHumanViewerHref(id).thumbnail.slice("/render?".length);
  await warmHumanViewerDocuments({
    revision,
    documents: publishedHumanViewerWarmDocuments(inventory.documents),
    currentRevision: () => readyRevision,
    cached: (id) => {
      const file = thumbnailFile(thumbnail(id));
      return file === null || fs.existsSync(file);
    },
    capture: async (id) => {
      const search = thumbnail(id);
      const png = await capture(parseHumanViewerAddress(search));
      const file = thumbnailFile(search);
      if (file !== null) await writeThumbnail(file, png);
    },
    queue: (id, run) => queue.run("warm " + id, run, "bulk"),
    status: warming,
  });
}
async function main(): Promise<void> {
  fs.mkdirSync(path.join(storage, "cache"), { recursive: true });
  const middleware = (
    request: IncomingMessage,
    response: ServerResponse,
    next: () => void,
  ): void => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1:5175");
    const json = (value: unknown): void => {
      response.setHeader("Content-Type", "application/json");
      response.end(JSON.stringify(value));
    };
    if (url.pathname === "/health")
      return json({
        service: "automovie-human-viewer",
        pid: process.pid,
        revision: inventory.revision,
        renderer,
        // A ready server can draw. It may be drawing the last good build
        // while the newest source fails: `serving` and `sourceError` say so.
        ready: readyRevision !== "" && renderer !== "",
        serving: {
          revision: readyRevision,
          current: inventory.revision,
          stale: readyRevision !== inventory.revision,
          goodAt: sourceStatus().goodAt,
        },
        sourceError: sourceStatus().error ?? errors[errors.length - 1] ?? null,
        compilation: sourceStatus(),
        errors,
        sourceUpdating,
        work,
        revisions: revisions.current(),
        queue: { limit: QUEUE_LIMIT, ...queue.status() },
        lastEdit,
        lastRender,
        lastBuild,
        builds,
        warm: warming,
        uptimeMs: Math.round(process.uptime() * 1000),
      });
    if (serveHumanViewerData({ url, request, response, root, storage,
      basisFiles, inputsDirectory, inventory, catalogue, json,
      publish: (nextInventory) => { inventory = nextInventory; },
    })) return;
    if (
      ["/render", "/parts", "/sheet", "/compare", "/warm"].includes(
        url.pathname,
      )
    ) {
      const start = performance.now();
      const lane = url.searchParams.get("lane") ?? (url.pathname === "/warm" ? "bulk" : "cli");
      if (lane !== "ui" && lane !== "cli" && lane !== "bulk") {
        response.statusCode = 422;
        return json({ error: "lane must be ui, cli or bulk" });
      }
      // A misspelled document fails here, not after a wait in the queue.
      for (const name of ["doc", "against"]) {
        const wanted = url.searchParams.get(name);
        if (
          wanted !== null &&
          url.searchParams.get("axes") === null &&
          !inventory.documents.some((entry) => entry.id === wanted)
        ) {
          response.statusCode = 422;
          return json({
            error: `Unknown document ${wanted}; ${inventory.documents.length} are published, see /docs`,
          });
        }
      }
      if (url.pathname === "/render" && lane === "bulk") {
        const file = thumbnailFile(url.search);
        if (file !== null && fs.existsSync(file)) {
          response.setHeader("Content-Type", "image/png");
          response.setHeader("X-Human-Build", "thumbnail-cache");
          response.setHeader("X-Human-Revision", inventory.revision);
          response.setHeader("X-Human-Stale", "false");
          fs.createReadStream(file).pipe(response);
          return;
        }
      }
      const received = performance.now();
      void queue.run(url.pathname + url.search, async () => {
        const queued = performance.now() - received;
        const fields = new URLSearchParams(url.search);
        fields.delete("lane");
        const axes = fields.get("axes");
        fields.delete("axes");
        const against = fields.get("against");
        fields.delete("against");
        if (url.pathname === "/sheet" && !fields.has("size"))
          fields.set("size", "320");
        applyHumanViewerPose(fields, (file) =>
          fs.readFileSync(
            path.join(root, "test/studies/human-face/connected-basis/global-face/population", file + ".json"),
            "utf8",
          ),
        );
        const address = parseHumanViewerAddress(fields.toString());
        const selectedRevision =
          readyRevision === "" ? inventory.revision : readyRevision;
        let png: Buffer;
        if (url.pathname === "/sheet") {
          if (axes === null) throw new Error("A sheet requires review axes");
          png = await renderHumanViewerSheet({
            page,
            capture,
            revision: () => readyRevision,
            cells: planHumanViewerSheet(
              address,
              axes,
              inventory.documents.map((entry) => entry.id),
            ),
          });
        } else if (url.pathname === "/warm") {
          const warmed = [];
          for (const entry of inventory.documents.filter(
            (entry) => entry.domain === "face",
          )) {
            const before = performance.now();
            await capture({ ...address, doc: entry.id });
            warmed.push({ document: entry.id, ms: performance.now() - before });
          }
          return json({ revision: selectedRevision, warmed });
        } else if (url.pathname === "/compare") {
          if (against === null)
            throw new Error("A comparison requires an against document");
          const first = PNG.sync.read(await capture(address));
          const second = PNG.sync.read(
            await capture({ ...address, doc: against }),
          );
          const compared = composeHumanViewerPixels(
            first.width,
            first.height,
            first.data,
            second.data,
          );
          const composed = new PNG({
            width: compared.width,
            height: compared.height,
          });
          composed.data.set(compared.data);
          png = PNG.sync.write(composed);
        } else png = await capture(address);
        if (readyRevision !== selectedRevision)
          throw new Error("Source changed during request");
        response.setHeader("X-Human-Revision", selectedRevision);
        response.setHeader("X-Human-Stale", String(selectedRevision !== inventory.revision));
        response.setHeader(
          "X-Viewer-Address",
          serializeHumanViewerAddress(address),
        );
        response.setHeader("X-Renderer", renderer);
        response.setHeader("X-Human-Build", lastRender?.build ?? "unknown");
        response.setHeader(
          "X-Render-Ms",
          (performance.now() - start).toFixed(1),
        );
        if (url.pathname === "/parts") {
          const parts = await page.evaluate(() =>
            (
              window as unknown as { __humanViewer: { parts: () => string[] } }
            ).__humanViewer.parts(),
          );
          return json(
            parts.map((name) => ({
              name,
              limitation:
                "Displayed mesh/material region, not an anatomical partition",
            })),
          );
        }
        if (url.pathname === "/render" && lane === "bulk" && selectedRevision === inventory.revision) {
          const file = thumbnailFile(url.search);
          if (file !== null) await writeThumbnail(file, png);
        }
        const before = performance.now();
        response.setHeader("Content-Type", "image/png");
        response.end(png);
        phases = {
          ...phases,
          queueMs: queued,
          responseMs: performance.now() - before,
          totalMs: performance.now() - received,
        };
        if (lastRender !== null) lastRender.phases = phases;
        console.log(
          "REQUEST",
          url.pathname,
          address.doc,
          JSON.stringify(
            Object.fromEntries(
              Object.entries(phases).map(([key, value]) => [key, Math.round(value)]),
            ),
          ),
        );
      }, lane).catch((error: unknown) => {
        response.statusCode = error instanceof HumanViewerQueueFullError ? 503 : 422;
        if (error instanceof HumanViewerQueueFullError)
          response.setHeader("Retry-After", "10");
        json({ error: error instanceof Error ? error.message : String(error) });
      });
      return;
    }
    if (url.pathname === "/view") request.url = "/view.html" + url.search;
    next();
  };
  const vite = await createServer({
    configFile: path.join(directory, "vite.config.mts"),
    plugins: [
      {
        name: "human-viewer-http",
        configureServer: (server) => {
          server.middlewares.use(middleware);
        },
      },
    ],
  });
  await vite.listen();
  const browser = await chromium.launch({
    channel: "chromium",
    headless: true,
    args: ["--use-gl=angle", "--ignore-gpu-blocklist"],
  });
  page = await browser.newPage({
    viewport: { width: 1160, height: 930 },
    deviceScaleFactor: 1,
  });
  const failed = (cause: string): void => {
    errors = [cause];
    readyRevision = "";
    lifetime.fail(new Error(cause));
  };
  page.on("crash", () => failed("Resident GPU page crashed"));
  page.on("close", () => failed("Resident GPU page closed"));
  browser.on("disconnected", () => failed("Resident GPU browser disconnected"));
  page.on("pageerror", (error) => {
    errors.push(error.message);
    console.error(error.message);
  });
  page.on("console", (message) => {
    if (message.text().startsWith("HUMAN_WORK ")) {
      work = readHumanViewerWork(message.text().slice(11));
      return;
    }
    if (message.text().startsWith("HUMAN_ERROR ")) {
      errors = [message.text().slice(12)];
      return;
    }
    if (message.text().startsWith("HUMAN_READY ")) {
      errors = [];
      readyRevision = message.text().slice(12);
      warmReadiness.source(readyRevision);
    }
  });
  await page.goto("http://127.0.0.1:5175/view?resident=1#ao=off", {
    timeout: 600000,
    waitUntil: "domcontentloaded",
  });
  await page.waitForFunction(
    () =>
      Boolean((window as unknown as { __humanViewer?: unknown }).__humanViewer),
    undefined,
    { timeout: 600000 },
  );
  renderer = await page.evaluate(() =>
    (
      window as unknown as { __humanViewer: { renderer: () => string } }
    ).__humanViewer.renderer(),
  );
  console.log("RENDERER", renderer);
  if (!judgeViewerRenderer(renderer).real)
    throw new Error("Software renderer refused");
  warmReadiness.hardware();
  fs.writeFileSync(
    path.join(storage, "server.json"),
    JSON.stringify({
      pid: process.pid,
      startedAt: new Date().toISOString(),
      port: 5175,
    }),
  );
  fs.mkdirSync(inputsDirectory, { recursive: true });
  const stopSources = subscribeHumanViewerSources({
    source,
    add: (files) => vite.watcher.add(files),
    watch: (changed) => { vite.watcher.on("all", changed); },
    inputs: () => { inventory = catalogue(); },
    updating: (value) => { sourceUpdating = value; },
    publish: (files, moved) => {
      lastEdit = { files: files.map((file) => path.relative(root, file)),
        at: new Date().toISOString(), moved };
      pendingEditAt = Date.now();
      inventory = catalogue();
    },
    browser: () => vite.ws.send({ type: "custom", event: "human:revision",
      data: { revision: inventory.revision } }),
    error: (error) => errors.push(error instanceof Error ? error.message : String(error)),
  });
  const close = async (): Promise<void> => {
    stopSources();
    await browser.close();
    await vite.close();
    fs.rmSync(path.join(storage, "server.json"), { force: true });
    process.exit(0);
  };
  process.once("SIGINT", () => void close());
  process.once("SIGTERM", () => void close());
  console.log("human-viewer ready http://127.0.0.1:5175/view", process.pid);
}
void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
