import { buildViewerBrowser } from "./buildViewerBrowser";
/**
 * Temple viewer CJS server. Each `/scene` request clears the production src
 * module cache and rebuilds its payload from current source. Failure returns
 * HTTP 500 and the error, without showing an earlier successful result.
 * `/section?axis=x|z&offset=m` returns exact current-source vertical section pieces;
 * `/review?grid=m` uses the self-check producer for overlaps, observation poses
 * and topology accounts. The browser does not import the engine.
 * Run `npm run viewer -- --port <port>` from the production root (default 4175).
 */
import { readFile } from "node:fs/promises";
import {
  type IncomingMessage,
  type ServerResponse,
  createServer,
} from "node:http";
import { dirname, resolve, sep } from "node:path";
import { parseArgs } from "node:util";

const productionRoot = resolve(__dirname, "../..");
const sourceRoot = resolve(productionRoot, "src") + sep;

/** Clear src modules except this server so the next require reads current source. */
const clearSource = (): void => {
  for (const key of Object.keys(require.cache)) {
    if (key.startsWith(sourceRoot) && !key.endsWith(`${sep}server.ts`))
      delete require.cache[key];
  }
};

/** Rebuild the payload and source basis, using the same basis as self-check. */
const freshPayload = (): { basis: string; payload: unknown } => {
  clearSource();
  const basis = (
    require("../review/source-basis") as typeof import("../review/source-basis")
  ).sourceBasis();
  const loaded = require("./payload") as typeof import("./payload");
  return { basis, payload: loaded.createViewerPayload() };
};

/** Isolated prototypes use the same current source-basis check as the building. */
const freshModelBoard = (): { basis: string; payload: unknown } => {
  clearSource();
  const basis = (
    require("../review/source-basis") as typeof import("../review/source-basis")
  ).sourceBasis();
  const loaded =
    require("./model-board-payload") as typeof import("./model-board-payload");
  return { basis, payload: loaded.createModelBoardPayload() };
};

/** Measure current source with the same producer as self-check. */
const freshReview = (grid: string | null): unknown => {
  const value = grid === null ? 0.01 : Number(grid);
  if (!(value > 0)) throw new Error("grid must be a positive value in meters.");
  clearSource();
  const loaded =
    require("../review/review-payload") as typeof import("../review/review-payload");
  return loaded.createReviewPayload(value);
};

/** Build exact vertical section pieces and ground lines on an X or Z plane. */
const freshSection = (axis: string | null, offset: string | null): unknown => {
  if (axis !== "x" && axis !== "z")
    throw new Error("axis must be x or z.");
  const value = Number(offset);
  if (offset === null || !Number.isFinite(value))
    throw new Error("offset must be a finite value in meters.");
  clearSource();
  const loaded = require("./section") as typeof import("./section");
  return loaded.createSectionPayload(axis, value);
};

const main = async (): Promise<void> => {
  const { values } = parseArgs({
    options: { port: { type: "string", default: "4175" } },
  });
  const port = Number(values.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("--port must be an integer from 1 to 65535.");
  const threeBuild = dirname(require.resolve("three"));
  const files = new Map([
    ["/", resolve(productionRoot, "public/index.html")],
    ["/model-board", resolve(productionRoot, "public/model-board.html")],
    ["/viewer.css", resolve(productionRoot, "public/viewer.css")],
    ["/vendor/three.module.js", resolve(threeBuild, "three.module.js")],
    ["/vendor/three.core.js", resolve(threeBuild, "three.core.js")],
    [
      "/vendor/OrbitControls.js",
      resolve(threeBuild, "../examples/jsm/controls/OrbitControls.js"),
    ],
    ...["stone", "paving", "plaster", "timber", "tile", "textile", "earth"].map(
      (name): [string, string] => [
        `/textures/${name}.png`,
        resolve(productionRoot, "public/textures", `${name}.png`),
      ],
    ),
  ]);
  const handle = async (
    request: IncomingMessage,
    response: ServerResponse,
  ): Promise<void> => {
    response.setHeader("Cache-Control", "no-store");
    if (request.method !== "GET") {
      response.writeHead(405).end();
      return;
    }
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    const path = url.pathname;
    if (path === "/model-board/scene") {
      try {
        response
          .writeHead(200, { "Content-Type": "application/json; charset=utf-8" })
          .end(JSON.stringify(freshModelBoard()));
      } catch (error) {
        response
          .writeHead(500, { "Content-Type": "text/plain; charset=utf-8" })
          .end(
            error instanceof Error
              ? (error.stack ?? error.message)
              : String(error),
          );
      }
      return;
    }
    if (path === "/section") {
      try {
        const section = freshSection(
          url.searchParams.get("axis"),
          url.searchParams.get("offset"),
        );
        response
          .writeHead(200, { "Content-Type": "application/json; charset=utf-8" })
          .end(JSON.stringify(section));
      } catch (error) {
        response
          .writeHead(500, { "Content-Type": "text/plain; charset=utf-8" })
          .end(
            error instanceof Error
              ? (error.stack ?? error.message)
              : String(error),
          );
      }
      return;
    }
    if (path === "/review") {
      try {
        const review = freshReview(url.searchParams.get("grid"));
        response
          .writeHead(200, { "Content-Type": "application/json; charset=utf-8" })
          .end(JSON.stringify(review));
      } catch (error) {
        response
          .writeHead(500, { "Content-Type": "text/plain; charset=utf-8" })
          .end(
            error instanceof Error
              ? (error.stack ?? error.message)
              : String(error),
          );
      }
      return;
    }
    if (path === "/scene") {
      try {
        const body = JSON.stringify(freshPayload());
        response
          .writeHead(200, { "Content-Type": "application/json; charset=utf-8" })
          .end(body);
      } catch (error) {
        response
          .writeHead(500, { "Content-Type": "text/plain; charset=utf-8" })
          .end(
            error instanceof Error
              ? (error.stack ?? error.message)
              : String(error),
          );
      }
      return;
    }
    if (path.startsWith("/assets/")) {
      const generated = (await buildViewerBrowser(productionRoot)).get(path);
      if (generated === undefined) { response.writeHead(404).end(); return; }
      response.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" }).end(generated);
      return;
    }
    const file = files.get(path);
    if (file === undefined) {
      response.writeHead(404).end();
      return;
    }
    const type = file.endsWith(".html")
      ? "text/html; charset=utf-8"
      : file.endsWith(".css")
        ? "text/css; charset=utf-8"
        : file.endsWith(".png")
          ? "image/png"
          : "text/javascript; charset=utf-8";
    response.writeHead(200, { "Content-Type": type }).end(await readFile(file));
  };
  const server = createServer((request, response) => {
    handle(request, response).catch((error: unknown) => {
      console.error(error);
      response.destroy();
    });
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`Temple viewer: http://127.0.0.1:${port}/`);
  });
};

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
