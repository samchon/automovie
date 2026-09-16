import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const publicRoot = resolve(projectRoot, "public");
const sourcePath = resolve(projectRoot, "src/spaces/ancient-civic-temple.ts");
const port = 4175;

const staticFiles = new Map([
  ["/", "index.html"],
  ["/index.html", "index.html"],
  ["/style.css", "style.css"],
  ["/src/viewer/client.js", "src/viewer/client.js"],
]);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

const writeJson = (response, status, value) => {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
};

const loadCurrentEnvironment = async () => {
  const sourceStat = await stat(sourcePath);
  const sourceUrl = new URL("../spaces/ancient-civic-temple.ts", import.meta.url);
  sourceUrl.searchParams.set("revision", String(sourceStat.mtimeMs));
  const module = await import(sourceUrl.href);
  const contribution = module.ancientCivicTempleSpaceSource.build({
    production: "ancient-civic-temple",
    branch: "spaces",
    design: "docs/spaces/temple.md",
    anchor: "#one-storey-civic-temple-graph",
    derivedArtifacts: {},
  });
  const environment = contribution.environments[0];
  if (environment === undefined) throw new Error("space source returned no environment");
  return { source: "src/spaces/ancient-civic-temple.ts", revision: sourceStat.mtimeMs, environment };
};

const serveStatic = async (requestPath, response) => {
  const relativePath = staticFiles.get(requestPath);
  if (relativePath === undefined) return false;
  const filePath = resolve(publicRoot, relativePath);
  if (!filePath.startsWith(publicRoot)) return false;
  const body = await readFile(filePath);
  response.writeHead(200, { "content-type": contentTypes[extname(filePath)] ?? "application/octet-stream" });
  response.end(body);
  return true;
};

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
    if (requestUrl.pathname === "/api/temple") {
      writeJson(response, 200, await loadCurrentEnvironment());
      return;
    }
    if (await serveStatic(requestUrl.pathname, response)) return;
    writeJson(response, 404, { error: "not found" });
  } catch (error) {
    writeJson(response, 500, { error: error instanceof Error ? error.message : String(error) });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Ancient civic temple viewer: http://127.0.0.1:${port}/`);
});
