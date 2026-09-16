import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const publicRoot = resolve(projectRoot, "public");
const sourcePath = resolve(projectRoot, "src/house.ts");
const port = Number(process.env.VIEWER_PORT ?? 4173);

const staticFiles = new Map([
  ["/", resolve(publicRoot, "index.html")],
  ["/index.html", resolve(publicRoot, "index.html")],
  ["/style.css", resolve(publicRoot, "style.css")],
  ["/src/viewer/client.js", resolve(projectRoot, "src/viewer/client.js")],
]);

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
]);

const loadCurrentSource = async () => {
  const revision = (await stat(sourcePath)).mtimeMs;
  const sourceUrl = new URL("../house.ts", import.meta.url);
  sourceUrl.searchParams.set("revision", String(revision));
  const source = await import(sourceUrl.href);
  return { revision, library: source.modernSuburbanHouse };
};

const write = (response, status, type, body) => {
  response.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store",
  });
  response.end(body);
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  try {
    if (url.pathname === "/api/house") {
      const { revision, library } = await loadCurrentSource();
      write(response, 200, "application/json; charset=utf-8", JSON.stringify({
        source: { file: "src/house.ts", revision },
        id: library.id,
        site: library.site,
        building: library.building,
        moduleLaws: library.moduleLaws,
        reviewPopulation: library.reviewPopulation,
        quantities: library.quantities,
        audits: {
          topology: library.topologyAudit,
          surfaces: library.surfaceAudit,
          site: library.siteAudit,
          vehicles: library.vehicleAudit,
        },
      }));
      return;
    }
    const file = staticFiles.get(url.pathname);
    if (file === undefined) {
      write(response, 404, "text/plain; charset=utf-8", "Not found");
      return;
    }
    const body = await readFile(file);
    write(response, 200, contentTypes.get(extname(file)) ?? "application/octet-stream", body);
  } catch (error) {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    write(response, 500, "text/plain; charset=utf-8", message);
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`modern-suburban-house live viewer: http://127.0.0.1:${port}/`);
});
