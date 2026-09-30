/**
 * Loopback-only resident GPU server, started as an attached session job:
 * `pnpm exec ttsx -P tsconfig.scripts.json scripts/human-viewer/server.ts`.
 * Vite transforms working-tree source; one real Chromium page serializes
 * capture requests. Numerical disk payloads and PID ownership live under the
 * ignored .shots tree. The host never edits documents or anatomical source.
 * HTTP failures include a cause and never return an earlier revision's PNG.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { chromium, type Page } from "playwright";
import { createServer } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { standardBodyReviewStates } from "../body-review/standardBodyReviewDocuments";
import { judgeViewerRenderer } from "../viewer/judgeViewerRenderer";
import type { HumanViewerAddress } from "./HumanViewerAddress";
import type { HumanViewerCatalogue } from "./HumanViewerCatalogue";
import { parseHumanViewerAddress } from "./parseHumanViewerAddress";
import { serializeHumanViewerAddress } from "./serializeHumanViewerAddress";
import { planHumanViewerSheet } from "./planHumanViewerSheet";
import { composeHumanViewerPixels } from "./composeHumanViewerPixels";
import { PNG } from "pngjs";
import { encodeHumanViewerPreview } from "./encodeHumanViewerPreview";

const directory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(directory, "../../..");
const storage = path.join(root, ".shots/human-viewer");
const basisFiles = { face: path.join(root, "test/studies/human-face/connected-basis/global-face/basis.json.gz"),
  body: path.join(root, "test/studies/human-body/connected-basis/basis.json.gz") };
const documentsFile = path.join(root, "test/studies/human-face/connected-basis/global-face/subjects.json");
const hash = (bytes: string | Buffer): string => createHash("sha256").update(bytes).digest("hex");
const sourceFiles = new Map<string, string>();
function collect(directory: string): void {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(file);
    else if (/\.(ts|mts|cts|json|html|wasm)$/.test(file)) sourceFiles.set(file, hash(fs.readFileSync(file)));
  }
}
for (const name of ["human", "engine", "interface", "viewer", "playground"]) collect(path.join(root, "packages", name, "src"));
collect(directory);
for (const file of ["pnpm-lock.yaml", "config/tsconfig.json", "packages/human/tsconfig.json", "packages/human/package.json", "test/package.json"])
  sourceFiles.set(path.join(root, file), hash(fs.readFileSync(path.join(root, file))));
const revision = (): string => hash([...sourceFiles].sort(([a], [b]) => a.localeCompare(b)).map(([file, digest]) => path.relative(root, file) + ":" + digest).join("\n"));
function catalogue(): HumanViewerCatalogue {
  const source = revision();
  const bases = Object.fromEntries(Object.entries(basisFiles).map(([domain, file]) => {
    const bytes = fs.readFileSync(file);
    const id = /^\s*\{\s*"id"\s*:\s*("(?:[^"\\]|\\.)*")/.exec(gunzipSync(bytes).toString("utf8"));
    if (id === null) throw new Error("Basis does not open with an identity");
    return [domain, { id: JSON.parse(id[1]) as string, digest: hash(bytes) }];
  }));
  const subjects = JSON.parse(fs.readFileSync(documentsFile, "utf8")) as Extract<HumanViewerCatalogue["documents"][number], { domain: "face" }>["document"][];
  const faces = [{ id: "connected-reference", name: "CC0 connected reference", basis: bases.face.id, shape: {}, expression: {} }, ...subjects];
  return { revision: source, documents: [
    ...faces.map((document) => ({ id: document.id, domain: "face" as const, document,
      key: hash(JSON.stringify(document) + bases.face.digest + source) })),
    ...Object.entries(standardBodyReviewStates()).map(([name, state]) => {
      const document = { id: "body:" + name, name, basis: bases.body.id, ...state };
      return { id: document.id, domain: "body" as const, document,
        key: hash(JSON.stringify(document) + bases.body.digest + source) };
    }),
  ] };
}
let inventory = catalogue();
let page: Page;
let renderer = "";
let errors: string[] = [];
let readyRevision = "";
let queue: Promise<void> = Promise.resolve();
const serial = <T,>(task: () => Promise<T>): Promise<T> => {
  const next = queue.then(task);
  queue = next.then(() => {}).catch(() => {});
  return next;
};
async function capture(address: HumanViewerAddress): Promise<Buffer> {
  if (!judgeViewerRenderer(renderer).real) throw new Error("A real GPU is required: " + renderer);
  if (errors.length !== 0) throw new Error("Source transformation failed: " + errors.join("; "));
  const selectedRevision = inventory.revision;
  await page.waitForFunction(() => Boolean((window as unknown as { __humanViewer?: unknown }).__humanViewer), undefined, { timeout: 120000 });
  // Passing the viewer explicitly avoids serializing a closure into the page.
  const result = await page.evaluate(async (input) => {
    const viewer = (window as unknown as { __humanViewer: {
      show: (address: HumanViewerAddress) => Promise<void>; png: () => string; revision: () => string;
    } }).__humanViewer;
    if (viewer.revision() !== input.revision) throw new Error("The source revision has not finished loading");
    await viewer.show(input.address);
    return viewer.png();
  }, { address, revision: selectedRevision });
  if (inventory.revision !== selectedRevision) throw new Error("Source changed during capture; the mixed revision was discarded");
  return Buffer.from(result.split(",")[1], "base64");
}
async function sheet(cells: ReturnType<typeof planHumanViewerSheet>): Promise<Buffer> {
  const frames = [];
  const selectedRevision = inventory.revision;
  for (const cell of cells) frames.push({ png: (await capture(cell.address)).toString("base64"), label: cell.label });
  if (inventory.revision !== selectedRevision) throw new Error("Source changed during sheet capture");
  const result = await page.evaluate(async ({ frames, size }) => {
    const columns = Math.ceil(Math.sqrt(frames.length));
    const caption = 42;
    const canvas = document.createElement("canvas");
    canvas.width = columns * size;
    canvas.height = Math.ceil(frames.length / columns) * (size + caption);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#1c252e"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "12px sans-serif";
    for (const [index, frame] of frames.entries()) {
      const image = new Image(); image.src = "data:image/png;base64," + frame.png; await image.decode();
      const x = index % columns * size, y = Math.floor(index / columns) * (size + caption);
      ctx.drawImage(image, x, y, size, size);
      ctx.fillStyle = "#eeeeee"; ctx.fillText(frame.label, x + 6, y + size + 22, size - 12);
    }
    return canvas.toDataURL("image/png");
  }, { frames, size: cells[0].address.size });
  return Buffer.from(result.split(",")[1], "base64");
}
async function main(): Promise<void> {
  fs.mkdirSync(path.join(storage, "cache"), { recursive: true });
  const middleware = (request: IncomingMessage, response: ServerResponse, next: () => void): void => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1:5175");
    const json = (value: unknown): void => { response.setHeader("Content-Type", "application/json"); response.end(JSON.stringify(value)); };
    if (url.pathname === "/health") return json({ service: "automovie-human-viewer", pid: process.pid, revision: inventory.revision, renderer, ready: readyRevision === inventory.revision && errors.length === 0, errors });
    if (url.pathname === "/docs") return json(inventory);
    if (url.pathname === "/reference-info" || url.pathname === "/reference") {
      const id = (url.searchParams.get("doc") ?? "").replace(/-connected$/, "");
      const directory = path.join(storage, "references");
      const filename = fs.existsSync(directory) ? fs.readdirSync(directory).find((name) => path.parse(name).name === id && /\.(png|jpg|jpeg|webp)$/i.test(name)) : undefined;
      if (url.pathname === "/reference-info") {
        const poses = JSON.parse(fs.readFileSync(path.join(root, "test/studies/human-face/connected-basis/global-face/population/poses-lens-frame.json"), "utf8"));
        const landmarksFile = path.join(directory, "landmarks.json");
        const landmarks = fs.existsSync(landmarksFile) ? JSON.parse(fs.readFileSync(landmarksFile, "utf8"))[id] : undefined;
        return json({ available: filename !== undefined, camera: filename === undefined ? null : poses[id] ?? null, landmarks: landmarks ?? [] });
      }
      if (filename === undefined) { response.statusCode = 404; response.end(); return; }
      response.setHeader("Cache-Control", "no-store");
      response.setHeader("Content-Type", filename.endsWith(".png") ? "image/png" : filename.endsWith(".webp") ? "image/webp" : "image/jpeg");
      fs.createReadStream(path.join(directory, filename)).pipe(response); return;
    }
    if (url.pathname.startsWith("/basis/")) {
      const domain = url.pathname.slice(7);
      if (domain !== "face" && domain !== "body") { response.statusCode = 404; response.end(); return; }
      response.setHeader("Content-Type", "application/gzip");
      fs.createReadStream(basisFiles[domain]).pipe(response); return;
    }
    if (url.pathname.startsWith("/cache/")) {
      const key = url.pathname.slice(7);
      if (!inventory.documents.some((document) => key === document.key + "-direct" || key === document.key + "-ao")) {
        response.statusCode = 409; return json({ error: "Unknown or stale numerical cache identity" });
      }
      const file = path.join(storage, "cache", key + ".json.gz");
      if (request.method === "PUT") {
        const chunks: Buffer[] = [];
        request.on("data", (chunk: Buffer) => chunks.push(chunk));
        request.on("end", () => {
          try {
            const bytes = Buffer.concat(chunks);
            const payload = JSON.parse(bytes.toString("utf8"));
            if (payload.operation !== "preview" || payload.model === undefined) throw new Error("Expected numerical preview");
            fs.writeFileSync(file + ".tmp", gzipSync(encodeHumanViewerPreview(payload)));
            fs.renameSync(file + ".tmp", file);
            response.statusCode = 204; response.end();
          } catch { response.statusCode = 400; json({ error: "Invalid numerical cache payload" }); }
        });
        return;
      }
      if (request.method !== "GET") { response.statusCode = 405; response.end(); return; }
      if (!fs.existsSync(file)) { response.statusCode = 404; response.end(); return; }
      response.setHeader("Content-Type", "application/json");
      response.setHeader("Content-Encoding", "gzip");
      fs.createReadStream(file).pipe(response); return;
    }
    if (["/render", "/parts", "/sheet", "/compare", "/warm"].includes(url.pathname)) {
      const start = performance.now();
      void serial(async () => {
        const fields = new URLSearchParams(url.search);
        const axes = fields.get("axes"); fields.delete("axes");
        const against = fields.get("against"); fields.delete("against");
        if (url.pathname === "/sheet" && !fields.has("size")) fields.set("size", "320");
        const address = parseHumanViewerAddress(fields.toString());
        const selectedRevision = inventory.revision;
        let png: Buffer;
        if (url.pathname === "/sheet") {
          if (axes === null) throw new Error("A sheet requires review axes");
          png = await sheet(planHumanViewerSheet(address, axes, inventory.documents.map((entry) => entry.id)));
        } else if (url.pathname === "/warm") {
          const warmed = [];
          for (const entry of inventory.documents.filter((entry) => entry.domain === "face")) {
            const before = performance.now();
            await capture({ ...address, doc: entry.id });
            warmed.push({ document: entry.id, ms: performance.now() - before });
          }
          return json({ revision: selectedRevision, warmed });
        } else if (url.pathname === "/compare") {
          if (against === null) throw new Error("A comparison requires an against document or revision");
          const first = PNG.sync.read(await capture(address));
          const second = PNG.sync.read(await capture({ ...address, doc: against }));
          const compared = composeHumanViewerPixels(first.width, first.height, first.data, second.data);
          const composed = new PNG({ width: compared.width, height: compared.height });
          composed.data.set(compared.data);
          png = PNG.sync.write(composed);
        } else png = await capture(address);
        if (inventory.revision !== selectedRevision) throw new Error("Source changed during request");
        response.setHeader("X-Human-Revision", selectedRevision);
        response.setHeader("X-Viewer-Address", serializeHumanViewerAddress(address));
        response.setHeader("X-Renderer", renderer);
        response.setHeader("X-Render-Ms", (performance.now() - start).toFixed(1));
        if (url.pathname === "/parts") {
          const parts = await page.evaluate(() => (window as unknown as { __humanViewer: { parts: () => string[] } }).__humanViewer.parts());
          return json(parts.map((name) => ({ name, limitation: "Displayed mesh/material region, not an anatomical partition" })));
        }
        response.setHeader("Content-Type", "image/png"); response.end(png);
      }).catch((error: unknown) => { response.statusCode = 422; json({ error: error instanceof Error ? error.message : String(error) }); });
      return;
    }
    if (url.pathname === "/view") request.url = "/view.html" + url.search;
    next();
  };
  const vite = await createServer({ configFile: path.join(directory, "vite.config.mts"), plugins: [{
    name: "human-viewer-http",
    configureServer: (server) => { server.middlewares.use(middleware); },
  }] });
  await vite.listen();
  const browser = await chromium.launch({ channel: "chromium", headless: true, args: ["--use-gl=angle", "--ignore-gpu-blocklist"] });
  page = await browser.newPage({ viewport: { width: 1160, height: 930 }, deviceScaleFactor: 1 });
  page.on("pageerror", (error) => { errors.push(error.message); console.error(error.message); });
  page.on("console", (message) => {
    if (message.text().startsWith("HUMAN_READY ")) readyRevision = message.text().slice(12);
  });
  await page.goto("http://127.0.0.1:5175/view#ao=off", { timeout: 600000, waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => Boolean((window as unknown as { __humanViewer?: unknown }).__humanViewer), undefined, { timeout: 600000 });
  renderer = await page.evaluate(() => (window as unknown as { __humanViewer: { renderer: () => string } }).__humanViewer.renderer());
  console.log("RENDERER", renderer);
  if (!judgeViewerRenderer(renderer).real) throw new Error("Software renderer refused");
  fs.writeFileSync(path.join(storage, "server.json"), JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString(), port: 5175 }));
  vite.watcher.add([...sourceFiles.keys(), ...Object.values(basisFiles), documentsFile]);
  let reload: ReturnType<typeof setTimeout> | undefined;
  vite.watcher.on("all", (_event, input: string) => {
    const file = path.resolve(input);
    if (!sourceFiles.has(file) && !Object.values(basisFiles).includes(file) && file !== documentsFile) return;
    if (sourceFiles.has(file)) {
      if (fs.existsSync(file)) sourceFiles.set(file, hash(fs.readFileSync(file)));
      else sourceFiles.delete(file);
    }
    inventory = catalogue();
    if (reload !== undefined) clearTimeout(reload);
    reload = setTimeout(() => {
      errors = [];
      readyRevision = "";
      vite.ws.send({ type: "custom", event: "human:revision", data: { revision: inventory.revision } });
    }, 100);
  });
  const close = async (): Promise<void> => {
    await browser.close(); await vite.close();
    fs.rmSync(path.join(storage, "server.json"), { force: true });
    process.exit(0);
  };
  process.once("SIGINT", () => void close()); process.once("SIGTERM", () => void close());
  console.log("human-viewer ready http://127.0.0.1:5175/view", process.pid);
}
void main().catch((error: unknown) => { console.error(error); process.exit(1); });
