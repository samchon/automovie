/**
 * Loopback-only resident GPU server, started as an attached session job:
 * `pnpm exec ttsx -P scripts/human-viewer/tsconfig.json scripts/human-viewer/server.mts`.
 * Vite transforms working-tree source; one real Chromium page serializes
 * capture requests. Numerical disk payloads and PID ownership live under the
 * ignored .shots tree. The host never edits documents or anatomical source.
 * HTTP failures include a cause and never return an earlier revision's PNG.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { gzip } from "node:zlib";
import { type Page, chromium } from "playwright";
import { PNG } from "pngjs";
import { createServer } from "vite";

import { HumanViewerQueueFullError } from "./HumanViewerQueueFullError";
import { readHumanViewerBasisIdentity } from "./readHumanViewerBasisIdentity";
import { judgeViewerRenderer } from "./judgeViewerRenderer";
import type { HumanViewerAddress } from "./HumanViewerAddress";
import { applyHumanViewerPose } from "./applyHumanViewerPose";
import { composeHumanViewerPixels } from "./composeHumanViewerPixels";
import { createHumanViewerQueue } from "./createHumanViewerQueue";
import { createHumanViewerRevisions } from "./createHumanViewerRevisions";
import { encodeHumanViewerPreview } from "./encodeHumanViewerPreview";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress";
import { openHumanViewerHref } from "./openHumanViewerHref";
import { planHumanViewerSheet } from "./planHumanViewerSheet";
import { readHumanViewerCatalogue } from "./readHumanViewerCatalogue.mjs";
import { renderHumanViewerSheet } from "./renderHumanViewerSheet.mjs";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress";
import { serveHumanViewerReference } from "./serveHumanViewerReference.mjs";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "../../..");
const storage = path.join(root, ".shots/human-viewer");
const basisFiles = {
  face: path.join(
    root,
    "test/studies/human-face/connected-basis/global-face/basis.json.gz",
  ),
  body: path.join(
    root,
    "test/studies/human-body/connected-basis/basis.json.gz",
  ),
};
const documentsFile = path.join(
  root,
  "test/studies/human-face/connected-basis/global-face/subjects.json",
);
const inputsDirectory = path.join(storage, "inputs");
const hash = (bytes: string | Buffer): string =>
  createHash("sha256").update(bytes).digest("hex");
const slash = (file: string): string => file.replaceAll("\\", "/");
const rootPath = slash(root);
const playground = (file: string): string =>
  `${rootPath}/packages/playground/src/human/${file}`;
const readText = (file: string): string | undefined => {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return undefined;
  }
};
/** Digest and identity of a large input file, recomputed only when it changes on disk. */
const memoized = new Map<string, { stamp: string; digest: string; id: string }>();
const basisOf = (file: string): { id: string; digest: string } => {
  const stat = fs.statSync(file);
  const stamp = `${stat.mtimeMs}:${stat.size}`;
  let kept = memoized.get(file);
  if (kept?.stamp !== stamp) {
    const bytes = fs.readFileSync(file);
    kept = {
      stamp,
      digest: hash(bytes),
      id: file.endsWith(".gz") ? readHumanViewerBasisIdentity(bytes) : "",
    };
    memoized.set(file, kept);
  }
  return kept;
};
/** The published bases and subject list: inputs no import graph names. */
const basisDigest = (): string =>
  [...Object.values(basisFiles), documentsFile]
    .map((file) => basisOf(file).digest)
    .join("");
let bases = basisDigest();
// Each digest covers only what its build imports, so an edit to the eye never
// invalidates a body document and a test or screen invalidates nothing.
const revisions = createHumanViewerRevisions({
  root: rootPath,
  entries: {
    browser: ["page.mts", "host.mts", "scene.html", "view.html"].map(
      (name) => `${slash(directory)}/${name}`,
    ),
    face: [
      playground("common/connectedAsset.ts"),
      playground("common/connectedRuntime.ts"),
    ],
    body: [
      playground("common/connectedAsset.ts"),
      playground("body/connectedBodyRuntime.ts"),
    ],
  },
  extra: [
    "pnpm-lock.yaml",
    "config/tsconfig.json",
    "packages/human/tsconfig.json",
    "packages/human/package.json",
    "test/package.json",
  ].map((file) => `${rootPath}/${file}`),
  bases: () => bases,
  io: {
    exists: (file) => fs.existsSync(file) && fs.statSync(file).isFile(),
    read: readText,
  },
});
const watched = [
  "human",
  "engine",
  "interface",
  "viewer",
  "playground",
].map((name) => path.join(root, "packages", name, "src"));
watched.push(directory);
const catalogue = () =>
  readHumanViewerCatalogue({
    basisFiles,
    documentsFile,
    inputsDirectory,
    basisOf,
    revisions: revisions.current(),
  });
let inventory = catalogue();
let page: Page;
let renderer = "";
let errors: string[] = [];
let readyRevision = "";
let sourceUpdating = false;
/** Requests allowed to wait behind the running one before a new one is refused. */
const QUEUE_LIMIT = 12;
const gzipAsync = promisify(gzip);
const queue = createHumanViewerQueue({
  limit: QUEUE_LIMIT,
  patience: 3,
  now: () => performance.now(),
});
/** The last edit that reached a build, and the edit still waiting for its first frame. */
let lastEdit: { files: string[]; at: string; moved: string[] } | null = null;
let pendingEditAt: number | null = null;
/** Milliseconds each stage of the last capture took; the rest of a request is the sum. */
interface IPhases {
  /** Waiting in the queue behind other requests. */
  queueMs?: number;
  /** Waiting for the GPU page to have loaded its modules (compile and transform). */
  pageWaitMs?: number;
  /** Inside the page: build (numerical worker or disk cache) plus drawing. */
  showMs?: number;
  /** Of showMs, the numerical worker's own build, zero when the result came from a cache. */
  buildMs?: number;
  /** Reading the canvas back to a PNG data URL. */
  pngMs?: number;
  /** Decoding the data URL into bytes in the server. */
  decodeMs?: number;
  /** Writing the response after the capture. */
  responseMs?: number;
  /** Request received to response written. */
  totalMs?: number;
}
let phases: IPhases = {};
let lastRender: {
  doc: string;
  ms: number;
  build: "cache" | "built";
  sinceEditMs: number | null;
  phases: IPhases;
} | null = null;
const lastBuild: Record<string, { doc: string; ms: number } | undefined> = {};
/** Every numerical build this server saw, by document, so a saving can be measured. */
const builds: Record<string, { ms: number; ao: boolean; at: string }> = {};
const warming = { revision: "", total: 0, done: 0, skipped: 0, current: null as string | null };
/** What the compile process last reported, read from the file it writes. */
function sourceStatus(): { error: string | null; goodAt: string | null } {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(storage, "source-status.json"), "utf8"),
    ) as { error: string | null; goodAt: string | null };
  } catch {
    return { error: null, goodAt: null };
  }
}
async function capture(address: HumanViewerAddress): Promise<Buffer> {
  if (!judgeViewerRenderer(renderer).real)
    throw new Error("A real GPU is required: " + renderer);
  // A broken working tree never stops the last good build from being drawn:
  // the frame says which build it came from and the source error stands beside it.
  const selectedRevision = readyRevision === "" ? inventory.revision : readyRevision;
  const started = performance.now();
  await page.waitForFunction(
    () =>
      Boolean((window as unknown as { __humanViewer?: unknown }).__humanViewer),
    undefined,
    { timeout: 120000 },
  );
  const waited = performance.now();
  // Passing the viewer explicitly avoids serializing a closure into the page.
  const result = await page.evaluate(
    async (input) => {
      const viewer = (
        window as unknown as {
          __humanViewer: {
            show: (address: HumanViewerAddress) => Promise<void>;
            png: () => string;
            revision: () => string;
            builds: () => number;
            buildMs: () => number;
          };
        }
      ).__humanViewer;
      if (viewer.revision() !== input.revision)
        throw new Error("The source revision has not finished loading");
      const before = viewer.builds();
      const t0 = performance.now();
      await viewer.show(input.address);
      const t1 = performance.now();
      const png = viewer.png();
      return {
        png,
        built: viewer.builds() - before,
        buildMs: viewer.buildMs(),
        showMs: t1 - t0,
        pngMs: performance.now() - t1,
      };
    },
    { address, revision: selectedRevision },
  );
  if (readyRevision !== selectedRevision)
    throw new Error(
      "Source changed during capture; the mixed revision was discarded",
    );
  const ms = performance.now() - started;
  const decoded = performance.now();
  const bytes = Buffer.from(result.png.split(",")[1], "base64");
  phases = {
    pageWaitMs: waited - started,
    showMs: result.showMs,
    buildMs: result.built === 0 ? 0 : result.buildMs,
    pngMs: result.pngMs,
    decodeMs: performance.now() - decoded,
  };
  const domain = address.doc.startsWith("person:")
    ? "person"
    : address.doc.startsWith("body:")
      ? "body"
      : "face";
  if (result.built !== 0) {
    lastBuild[domain] = { doc: address.doc, ms: result.buildMs };
    builds[address.doc] = {
      ms: result.buildMs,
      ao: address.ao,
      at: new Date().toISOString(),
    };
  }
  lastRender = {
    doc: address.doc,
    ms,
    build: result.built === 0 ? "cache" : "built",
    sinceEditMs: pendingEditAt === null ? null : Date.now() - pendingEditAt,
    phases,
  };
  pendingEditAt = null;
  return bytes;
}
/**
 * The disk file of a thumbnail: the address and the numerical key of its
 * document name it, so an edit that changes the document's build makes a new
 * file and a stale picture is never served for it. Null for an address that
 * does not parse or names no document.
 */
function thumbnailFile(search: string): string | null {
  try {
    const fields = new URLSearchParams(search);
    fields.delete("lane");
    const address = parseHumanViewerAddress(fields.toString());
    const document = inventory.documents.find((entry) => entry.id === address.doc);
    if (document === undefined) return null;
    return path.join(
      storage,
      "thumbnails",
      hash(serializeHumanViewerAddress(address) + document.key) + ".png",
    );
  } catch {
    return null;
  }
}
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
  // The thumbnail is the frame the index shows, so drawing it also builds the model.
  const thumbnail = (id: string): string =>
    openHumanViewerHref(id).thumbnail.slice("/render?".length);
  const pending = inventory.documents.filter((entry) => {
    const file = thumbnailFile(thumbnail(entry.id));
    return file !== null && !fs.existsSync(file);
  });
  Object.assign(warming, {
    revision,
    total: inventory.documents.length,
    done: inventory.documents.length - pending.length,
    skipped: 0,
    current: null,
  });
  for (const entry of pending) {
    if (readyRevision !== revision || warming.revision !== revision) return;
    warming.current = entry.id;
    try {
      await queue.run(
        "warm " + entry.id,
        async () => {
          const search = thumbnail(entry.id);
          const png = await capture(parseHumanViewerAddress(search));
          const file = thumbnailFile(search);
          if (file !== null) await writeThumbnail(file, png);
        },
        "bulk",
      );
      ++warming.done;
    } catch {
      ++warming.skipped;
    }
  }
  warming.current = null;
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
        errors,
        sourceUpdating,
        revisions: revisions.current(),
        queue: { limit: QUEUE_LIMIT, ...queue.status() },
        lastEdit,
        lastRender,
        lastBuild,
        builds,
        warm: warming,
        uptimeMs: Math.round(process.uptime() * 1000),
      });
    if (url.pathname === "/docs") return json(inventory);
    if (serveHumanViewerReference({
        url,
        response,
        root,
        storage,
        documents: inventory.documents.map((entry) => entry.id),
        json,
      })) return;
    if (url.pathname.startsWith("/basis/")) {
      const domain = url.pathname.slice(7);
      if (domain !== "face" && domain !== "body") {
        response.statusCode = 404;
        response.end();
        return;
      }
      const candidate = url.searchParams.get("candidate");
      const file =
        candidate === null
          ? basisFiles[domain]
          : path.join(
              inputsDirectory,
              candidate.split("@")[0] + ".basis.json.gz",
            );
      if (
        (candidate !== null && !/^[A-Za-z0-9._-]+(@[0-9a-f]+)?$/.test(candidate)) ||
        !fs.existsSync(file)
      ) {
        response.statusCode = 404;
        response.end();
        return;
      }
      response.setHeader("Content-Type", "application/gzip");
      fs.createReadStream(file).pipe(response);
      return;
    }
    if (url.pathname === "/rescan") {
      inventory = catalogue();
      return json({
        documents: inventory.documents
          .filter((entry) => entry.id.startsWith("file:"))
          .map((entry) => entry.id),
        rejected: inventory.rejected,
      });
    }
    if (url.pathname.startsWith("/cache/")) {
      const key = url.pathname.slice(7);
      if (
        !inventory.documents.some(
          (document) =>
            key === document.key + "-direct" || key === document.key + "-ao",
        )
      ) {
        response.statusCode = 409;
        return json({ error: "Unknown or stale numerical cache identity" });
      }
      const file = path.join(storage, "cache", key + ".json.gz");
      if (request.method === "PUT") {
        const chunks: Buffer[] = [];
        request.on("data", (chunk: Buffer) => chunks.push(chunk));
        request.on("end", () => {
          void (async () => {
            const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            if (payload.operation !== "preview" || payload.model === undefined)
              throw new Error("Expected numerical preview");
            // Compression runs off the event loop so /health keeps answering.
            await fs.promises.writeFile(
              file + ".tmp",
              await gzipAsync(encodeHumanViewerPreview(payload)),
            );
            await fs.promises.rename(file + ".tmp", file);
            response.statusCode = 204;
            response.end();
          })().catch(() => {
            response.statusCode = 400;
            json({ error: "Invalid numerical cache payload" });
          });
        });
        return;
      }
      if (request.method !== "GET") {
        response.statusCode = 405;
        response.end();
        return;
      }
      if (!fs.existsSync(file)) {
        response.statusCode = 404;
        response.end();
        return;
      }
      response.setHeader("Content-Type", "application/json");
      response.setHeader("Content-Encoding", "gzip");
      fs.createReadStream(file).pipe(response);
      return;
    }
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
        if (url.pathname === "/render" && lane === "bulk") {
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
  page.on("pageerror", (error) => {
    errors.push(error.message);
    console.error(error.message);
  });
  page.on("console", (message) => {
    if (message.text().startsWith("HUMAN_ERROR ")) {
      errors = [message.text().slice(12)];
      return;
    }
    if (message.text().startsWith("HUMAN_READY ")) {
      errors = [];
      readyRevision = message.text().slice(12);
      void warm(readyRevision);
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
  fs.writeFileSync(
    path.join(storage, "server.json"),
    JSON.stringify({
      pid: process.pid,
      startedAt: new Date().toISOString(),
      port: 5175,
    }),
  );
  fs.mkdirSync(inputsDirectory, { recursive: true });
  vite.watcher.add([
    inputsDirectory,
    ...watched,
    ...Object.values(basisFiles),
    documentsFile,
  ]);
  let reload: ReturnType<typeof setTimeout> | undefined;
  const changed = new Set<string>();
  vite.watcher.on("all", (_event, input: string) => {
    const file = path.resolve(input);
    if (file.startsWith(inputsDirectory + path.sep)) {
      inventory = catalogue();
      return;
    }
    const inputFile =
      Object.values(basisFiles).includes(file) || file === documentsFile;
    // An edit to a file no build reads cannot change a frame or a cache key.
    if (!inputFile && !revisions.reaches(slash(file))) return;
    sourceUpdating = true;
    changed.add(file);
    if (reload !== undefined) clearTimeout(reload);
    reload = setTimeout(() => {
      try {
        bases = basisDigest();
        const files = [...changed];
        changed.clear();
        const { moved } = revisions.changed(files.map(slash));
        if (moved.length !== 0) {
          lastEdit = { files: files.map((file) => path.relative(root, file)), at: new Date().toISOString(), moved };
          pendingEditAt = Date.now();
          inventory = catalogue();
        }
        sourceUpdating = false;
        if (moved.includes("browser"))
          vite.ws.send({
            type: "custom",
            event: "human:revision",
            data: { revision: inventory.revision },
          });
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }, 100);
  });
  const close = async (): Promise<void> => {
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
