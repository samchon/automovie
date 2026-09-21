import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { createViewerPayload } from "./payload";

const productionRoot = resolve(__dirname, "../..");

/** Hash authored input bytes; changed input requires a clean coordinator restart. */
async function sourceBasis(): Promise<string> {
  const hash = createHash("sha256");
  async function visit(relative: string): Promise<void> {
    for (const item of (await readdir(resolve(productionRoot, relative), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const child = relative + "/" + item.name;
      if (item.isDirectory()) await visit(child);
      else if (item.isFile()) hash.update(child).update(await readFile(resolve(productionRoot, child)));
    }
  }
  for (const directory of ["src", "docs/settings", "docs/spaces", "docs/contracts", "public"]) await visit(directory);
  for (const file of ["package.json", "lint.config.ts"]) hash.update(file).update(await readFile(resolve(productionRoot, file)));
  return hash.digest("hex");
}

async function main(): Promise<void> {
  // The coordinator assigns ports in the shared harness; 1953 defaults to 4174.
  const { values } = parseArgs({ options: { port: { type: "string", default: "4174" } } });
  const port = Number(values.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("--port must be an integer between 1 and 65535");
  const basis = await sourceBasis();
  const payload = createViewerPayload();
  const threeBuild = dirname(require.resolve("three"));
  const threeRoot = resolve(threeBuild, "..");
  const files = new Map([
    ["/", resolve(productionRoot, "public/index.html")],
    ["/viewer.css", resolve(productionRoot, "public/viewer.css")],
    ["/src/viewer/client.mjs", resolve(productionRoot, "src/viewer/client.mjs")],
    ["/src/viewer/scene.mjs", resolve(productionRoot, "src/viewer/scene.mjs")],
    ["/vendor/three.module.js", resolve(threeBuild, "three.module.js")],
    ["/vendor/three.core.js", resolve(threeBuild, "three.core.js")],
    ["/vendor/OrbitControls.js", resolve(threeRoot, "examples/jsm/controls/OrbitControls.js")],
  ]);
  async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
    response.setHeader("Cache-Control", "no-store");
    try {
      if (request.method !== "GET") { response.writeHead(405).end(); return; }
      const path = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
      if (path === "/scene" || path === "/basis") {
        if (await sourceBasis() !== basis) {
          response.writeHead(409, { "Content-Type": "application/json" }).end(JSON.stringify({ error: "Source changed. Coordinator must restart the viewer after npm run lint." }));
          return;
        }
        response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(path === "/basis" ? { basis } : { basis, ...payload }));
        return;
      }
      const file = files.get(path);
      if (!file) { response.writeHead(404).end(); return; }
      const contentType = file.endsWith(".html") ? "text/html; charset=utf-8" : file.endsWith(".css") ? "text/css; charset=utf-8" : "text/javascript; charset=utf-8";
      const bytes = await readFile(file);
      response.writeHead(200, { "Content-Type": contentType }).end(bytes);
    } catch (error) {
      response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" }).end(error instanceof Error ? error.message : String(error));
    }
  }
  const server = createServer((request, response) => {
    void handleRequest(request, response).catch((error: unknown) => { console.error(error); response.destroy(); });
  });
  server.listen(port, "127.0.0.1", () => console.log("House viewer: http://127.0.0.1:" + port + "/ source " + basis));
}
void main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
