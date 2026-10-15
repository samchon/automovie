/**
 * HTTP server for the production's live 3D view.
 *
 * Responsibility: settings `execution-boundary` keeps `@automovie/engine` a
 * CommonJS package and places engine interpretation on the server side.
 * This `.ts` entry runs as an ES module under `tsx`, loads the CommonJS engine
 * through Node interop, and hands the browser only a
 * transient JSON scene plus static files. Settings `viewer-handoff` fixes the
 * runner (`tsx`), the `--port` argument and
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
 * - `/src/viewer/<name>.js` serves browser modules from this directory;
 * - `/scene` builds the current house scene on every request;
 *   `/scene?subject=calibration` builds the calibration shape instead.
 *
 * Staleness: the server digests the production source (`src`,
 * `public`, `package.json`) and any model-input module at
 * start. If a later `/scene` request finds a different digest it answers 409,
 * preventing that request from receiving a scene from stale loaded modules.
 * The client fetches once and does not poll for changes or invalidate an
 * already displayed frame. The coordinator restarts the server and reloads
 * the page; responses are uncached and no scene is written to disk.
 */
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { readFileSync, readdirSync, statSync } from "node:fs";
import {
  type IncomingMessage,
  type ServerResponse,
  createServer,
} from "node:http";
import { dirname, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";

import { MaterialReview } from "../materials/MaterialReview";
import { Frame } from "../models/Frame";
import { buildHouseEnvironment } from "../spaces/buildHouseEnvironment";
import { buildHouse } from "../spaces/buildHouse";
import { buildBuildingInputs } from "./buildBuildingInputs.js";
import { buildCalibrationScene } from "./buildCalibrationScene.js";
import { buildHouseScene } from "./buildHouseScene.js";
import type { IViewerModelInputs } from "./IViewerModelInputs";
import type { IHouse } from "../spaces/IHouse";

const require: NodeJS.Require = createRequire(import.meta.url);

/** Production root: this file lives at `src/viewer/server.ts`. */
const ROOT: string = resolve(import.meta.dirname, "..", "..");

/** Load production values from source rather than a serialized design store. */
const loadViewerModelInputs: (moduleFile: string) => IViewerModelInputs = (moduleFile: string): IViewerModelInputs => {
  const loaded: { buildViewerModelInputs?: unknown; } = require(moduleFile) as { buildViewerModelInputs?: unknown };
  if (typeof loaded.buildViewerModelInputs !== "function")
    throw new Error(`${moduleFile} must export buildViewerModelInputs()`);
  return (loaded.buildViewerModelInputs as () => IViewerModelInputs)();
};

/** Directory of the installed three.js build files. */
const THREE_BUILD: string = dirname(require.resolve("three"));

/** Source inputs whose change makes a running view stale. */
const DIGEST_INPUTS: string[] = [
  "src",
  "public",
  "package.json",
];

/** Follow stat-visible files recursively in code-unit name order. Missing paths yield no files; links are followed and cyclic directory links are not guarded. */
const listFiles: (path: string) => string[] = (path: string): string[] => {
  const stat: import("fs").Stats | undefined = statSync(path, { throwIfNoEntry: false });
  if (stat === undefined) return [];
  if (stat.isFile()) return [path];
  // Code-unit order, not locale order, so the digest is the same on every host.
  return readdirSync(path)
    .sort((left: string, right: string) : 1 | -1 | 0 => (left < right ? -1 : left > right ? 1 : 0))
    .flatMap((name: string) : string[] => listFiles(join(path, name)));
};

/** Hash configured production paths and bytes into a 12-hex basis label. This synchronous read excludes workspace dependency files and does not provide an atomic snapshot while files are changing. */
const digestSource: (modelInputsFile?: string) => string = (modelInputsFile?: string): string => {
  const hash: import("crypto").Hash = createHash("sha256");
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

/** Browser modules may only be flat `.js` files in this directory. */
const BROWSER_MODULE: RegExp = /^\/src\/viewer\/([a-zA-Z0-9-]+\.js)$/;
const TEXTURE_FILE: RegExp = /^\/textures\/([a-z0-9-]+\.png)$/;

/** Write one response without caching, so a reload always asks again. */
const send: (response: ServerResponse, status: number, type: string, body: string | Buffer) => void = (
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

/** Route one GET request. Invalid query alternatives receive explicit HTTP refusals; filesystem, JSON serialization and scene/model-construction failures propagate to main's HTTP 500 handler. */
const handle: (request: IncomingMessage, response: ServerResponse, startDigest: string, modelInputsFile?: string) => void = (
  request: IncomingMessage,
  response: ServerResponse,
  startDigest: string,
  modelInputsFile?: string,
): void => {
  const url: URL = new URL(request.url ?? "/", "http://localhost");
  const path: string = url.pathname;
  if (request.method !== "GET")
    return send(response, 405, "text/plain; charset=utf-8", "GET only");
  const fixed: { file: string; type: string; } = STATIC_FILES[path === "/index.html" ? "/" : path];
  if (fixed !== undefined)
    return send(response, 200, fixed.type, readFileSync(fixed.file));
  const module: RegExpExecArray | null = BROWSER_MODULE.exec(path);
  if (module !== null)
    return send(
      response,
      200,
      "text/javascript; charset=utf-8",
      readFileSync(join(ROOT, "src", "viewer", module[1]!)),
    );
  const texture: RegExpExecArray | null = TEXTURE_FILE.exec(path);
  if (texture !== null)
    return send(
      response,
      200,
      "image/png",
      readFileSync(join(ROOT, "public", "textures", texture[1]!)),
    );
  if (path === "/scene") {
    const subject: string | null = url.searchParams.get("subject");
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
    const current: string = digestSource(modelInputsFile);
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
      const mode: string = url.searchParams.get("mode") ?? "neutral";
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
      const pose: string = url.searchParams.get("pose") ?? "closed";
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
      const house: IHouse = buildHouse(),
        environment: import("@automovie/interface").IAutoMovieBuiltEnvironment & { pendingMapGround: { parts: string[]; zones: string[]; }; } = buildHouseEnvironment(house);
      const input: IViewerModelInputs = buildBuildingInputs(environment, house, pose),
        bounds: IViewerModelInputs = buildBuildingInputs(
          environment,
          house,
          pose === "closed" ? "maximum" : "closed",
        );
      const view: string = url.searchParams.get("view") ?? "front";
      if (view !== "front" && view !== "side" && view !== "diagonal")
        return send(
          response,
          400,
          "application/json",
          JSON.stringify({ error: `invalid model view: ${view}` }),
        );
      const id: string = url.searchParams.get("model") ?? input.prototypes[0]!.model.id;
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
const main: () => void = (): void => {
  const { values }: { values: { port: string; host: string; "model-inputs"?: string | undefined; }; positionals: []; } = parseArgs({
    options: {
      port: { type: "string", default: "4173" },
      host: { type: "string", default: "127.0.0.1" },
      "model-inputs": { type: "string" },
    },
  });
  const port: number = Number(values.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error(
      `--port must be an integer in 1..65535, got ${values.port}`,
    );
  const modelInputsFile: string | undefined =
    values["model-inputs"] === undefined
      ? undefined
      : resolve(values["model-inputs"]);
  const startDigest: string = digestSource(modelInputsFile);
  const server: import("http").Server<typeof IncomingMessage, typeof ServerResponse> = createServer((request: IncomingMessage, response: ServerResponse<IncomingMessage> & { req: IncomingMessage; }) : void => {
    try {
      handle(request, response, startDigest, modelInputsFile);
    } catch (error) {
      send(response, 500, "text/plain; charset=utf-8", String(error));
    }
  });
  server.listen(port, values.host, () : void => {
    console.info(
      `viewer listening on http://${values.host}:${port}/ (source ${startDigest})`,
    );
  });
};

main();
