/**
 * CommonJS HTTP server for the production's live 3D view.
 *
 * Responsibility: settings `execution-boundary` keeps `@automovie/engine` a
 * CommonJS package and places engine interpretation on the server side.
 * This `.cts` entry therefore runs as CommonJS under `tsx`, reads the engine
 * through ordinary `require` resolution, and hands the browser only a
 * transient JSON scene plus static files. Settings `viewer-handoff` fixes the
 * runner (`tsx`, kept apart from the evidence lint), the `--port` argument and
 * its default 4173.
 *
 * Start: `npm run viewer -- --port 4173` from the production directory, then
 * open `http://127.0.0.1:4173/`.
 * `--model-inputs <module>` adds generated model prototypes, placements,
 * face finishes, and model-owned UVs to the same house scene for inspection.
 * The module exports a typed `buildViewerModelInputs()` function.
 *
 * Routes:
 * - `/` serves `public/index.html`;
 * - `/vendor/three.module.js`, `/vendor/three.core.js` and
 *   `/vendor/OrbitControls.js` serve the installed three.js build;
 * - `/src/viewer/<name>.mjs` serves browser modules from this directory;
 * - `/scene` builds the current house scene on every request;
 *   `/scene?subject=calibration` builds the calibration shape instead.
 *
 * Staleness: the server digests the production source (`src`, `docs`,
 * `public`, `lint.config.ts`, `package.json`) and any model-input module at
 * start. If a later `/scene` request finds a different digest it answers 409,
 * so a page can never keep presenting an old scene as the current result
 * (live-viewing rule). The
 * coordinator restarts the server; nothing is cached or written to disk.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import {
  type IncomingMessage,
  type ServerResponse,
  createServer,
} from "node:http";
import { dirname, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";

import { MaterialReview } from "../materials/review";
import { Frame } from "../models/frame";
import { buildHouseEnvironment } from "../spaces/environment";
import { buildHouse } from "../spaces/house";
import { buildBuildingInputs } from "./buildingInputs.cjs";
import { buildCalibrationScene } from "./calibration.cjs";
import { buildHouseScene } from "./houseScene.cjs";
import type { IViewerModelInputs } from "./modelScene.cjs";

/** Production root: this file lives at `src/viewer/server.cts`. */
const ROOT = resolve(__dirname, "..", "..");

/** Load production values from source rather than a serialized design store. */
const loadViewerModelInputs = (moduleFile: string): IViewerModelInputs => {
  const loaded = require(moduleFile) as { buildViewerModelInputs?: unknown };
  if (typeof loaded.buildViewerModelInputs !== "function")
    throw new Error(`${moduleFile} must export buildViewerModelInputs()`);
  return (loaded.buildViewerModelInputs as () => IViewerModelInputs)();
};

/** Directory of the installed three.js build files. */
const THREE_BUILD = dirname(require.resolve("three"));

/** Source inputs whose change makes a running view stale. */
const DIGEST_INPUTS = [
  "src",
  "docs",
  "public",
  "lint.config.ts",
  "package.json",
];

/** Collect every regular file under one input, in a stable order. */
const listFiles = (path: string): string[] => {
  const stat = statSync(path, { throwIfNoEntry: false });
  if (stat === undefined) return [];
  if (stat.isFile()) return [path];
  // Code-unit order, not locale order, so the digest is the same on every host.
  return readdirSync(path)
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
    .flatMap((name) => listFiles(join(path, name)));
};

/** Digest the production source so a scene names the basis it came from. */
const digestSource = (modelInputsFile?: string): string => {
  const hash = createHash("sha256");
  for (const input of DIGEST_INPUTS)
    for (const file of listFiles(join(ROOT, input))) {
      hash.update(relative(ROOT, file).replaceAll("\\", "/"));
      hash.update("\0");
      hash.update(readFileSync(file));
      hash.update("\0");
    }
  if (modelInputsFile !== undefined) {
    hash.update(modelInputsFile);
    hash.update("\0");
    hash.update(readFileSync(modelInputsFile));
  }
  return hash.digest("hex").slice(0, 12);
};

/** Static files the page needs, by request path. */
const STATIC_FILES: Record<string, { file: string; type: string }> = {
  "/": {
    file: join(ROOT, "public", "index.html"),
    type: "text/html; charset=utf-8",
  },
  "/vendor/three.module.js": {
    file: join(THREE_BUILD, "three.module.js"),
    type: "text/javascript; charset=utf-8",
  },
  "/vendor/three.core.js": {
    file: join(THREE_BUILD, "three.core.js"),
    type: "text/javascript; charset=utf-8",
  },
  "/vendor/OrbitControls.js": {
    file: join(
      THREE_BUILD,
      "..",
      "examples",
      "jsm",
      "controls",
      "OrbitControls.js",
    ),
    type: "text/javascript; charset=utf-8",
  },
  "/vendor/Reflector.js": {
    file: join(THREE_BUILD, "..", "examples", "jsm", "objects", "Reflector.js"),
    type: "text/javascript; charset=utf-8",
  },
};

/** Browser modules may only be flat `.mjs` files in this directory. */
const BROWSER_MODULE = /^\/src\/viewer\/([a-zA-Z0-9-]+\.mjs)$/;
const TEXTURE_FILE = /^\/textures\/([a-z0-9-]+\.png)$/;

/** Write one response without caching, so a reload always asks again. */
const send = (
  response: ServerResponse,
  status: number,
  type: string,
  body: string | Buffer,
): void => {
  response.writeHead(status, {
    "content-type": type,
    "cache-control": "no-store",
  });
  response.end(body);
};

/** Route one request. Throws only on unexpected file-system failure. */
const handle = (
  request: IncomingMessage,
  response: ServerResponse,
  startDigest: string,
  modelInputsFile?: string,
): void => {
  const url = new URL(request.url ?? "/", "http://localhost");
  const path = url.pathname;
  if (request.method !== "GET")
    return send(response, 405, "text/plain; charset=utf-8", "GET only");
  const fixed = STATIC_FILES[path === "/index.html" ? "/" : path];
  if (fixed !== undefined)
    return send(response, 200, fixed.type, readFileSync(fixed.file));
  const module = BROWSER_MODULE.exec(path);
  if (module !== null)
    return send(
      response,
      200,
      "text/javascript; charset=utf-8",
      readFileSync(join(ROOT, "src", "viewer", module[1]!)),
    );
  const texture = TEXTURE_FILE.exec(path);
  if (texture !== null)
    return send(
      response,
      200,
      "image/png",
      readFileSync(join(ROOT, "public", "textures", texture[1]!)),
    );
  if (path === "/scene") {
    const subject = url.searchParams.get("subject");
    if (
      subject !== null &&
      subject !== "calibration" &&
      subject !== "model-review" &&
      subject !== "material-review"
    )
      return send(
        response,
        404,
        "text/plain; charset=utf-8",
        `unknown subject: ${subject}`,
      );
    const current = digestSource(modelInputsFile);
    if (current !== startDigest)
      return send(
        response,
        409,
        "application/json; charset=utf-8",
        JSON.stringify({
          error:
            "production source changed after the viewer started; restart the viewer",
          startDigest,
          currentDigest: current,
        }),
      );
    if (subject === "material-review") {
      const mode = url.searchParams.get("mode") ?? "neutral";
      if (mode !== "neutral" && mode !== "baseline")
        return send(
          response,
          400,
          "application/json",
          JSON.stringify({ error: `invalid material mode: ${mode}` }),
        );
      return send(
        response,
        200,
        "application/json",
        JSON.stringify(
          new MaterialReview().build(
            Number(url.searchParams.get("page") ?? 0),
            mode,
            current,
          ),
        ),
      );
    }
    if (subject === "model-review") {
      const pose = url.searchParams.get("pose") ?? "closed";
      if (
        pose !== "closed" &&
        pose !== "maximum" &&
        pose !== "maximum-opposite"
      )
        return send(
          response,
          400,
          "application/json",
          JSON.stringify({ error: `invalid inspection pose: ${pose}` }),
        );
      const house = buildHouse(),
        environment = buildHouseEnvironment(house);
      const input = buildBuildingInputs(environment, house, pose),
        bounds = buildBuildingInputs(
          environment,
          house,
          pose === "closed" ? "maximum" : "closed",
        );
      const view = url.searchParams.get("view") ?? "front";
      if (view !== "front" && view !== "side" && view !== "diagonal")
        return send(
          response,
          400,
          "application/json",
          JSON.stringify({ error: `invalid model view: ${view}` }),
        );
      const id = url.searchParams.get("model") ?? input.prototypes[0]!.model.id;
      return send(
        response,
        200,
        "application/json; charset=utf-8",
        JSON.stringify(
          new Frame().build(
            input,
            id,
            view,
            url.searchParams.get("overlay") === "true",
            current,
            bounds,
          ),
        ),
      );
    }
    return send(
      response,
      200,
      "application/json; charset=utf-8",
      JSON.stringify(
        subject === "calibration"
          ? buildCalibrationScene(current)
          : buildHouseScene(
              current,
              modelInputsFile === undefined
                ? undefined
                : loadViewerModelInputs(modelInputsFile),
            ),
      ),
    );
  }
  if (path === "/favicon.ico") return send(response, 204, "text/plain", "");
  return send(response, 404, "text/plain; charset=utf-8", `not found: ${path}`);
};

/** Parse viewer options, then listen. */
const main = (): void => {
  const { values } = parseArgs({
    options: {
      port: { type: "string", default: "4173" },
      host: { type: "string", default: "127.0.0.1" },
      "model-inputs": { type: "string" },
    },
  });
  const port = Number(values.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error(
      `--port must be an integer in 1..65535, got ${values.port}`,
    );
  const modelInputsFile =
    values["model-inputs"] === undefined
      ? undefined
      : resolve(values["model-inputs"]);
  const startDigest = digestSource(modelInputsFile);
  const server = createServer((request, response) => {
    try {
      handle(request, response, startDigest, modelInputsFile);
    } catch (error) {
      send(response, 500, "text/plain; charset=utf-8", String(error));
    }
  });
  server.listen(port, values.host, () => {
    console.info(
      `viewer listening on http://${values.host}:${port}/ (source ${startDigest})`,
    );
  });
};

main();
