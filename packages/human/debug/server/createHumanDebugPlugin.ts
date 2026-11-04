import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";

import { HUMAN_DEBUG_CAMERAS } from "../contracts/HUMAN_DEBUG_CAMERAS";
import { HUMAN_DEBUG_ROUTES } from "../contracts/HUMAN_DEBUG_ROUTES";
import { HumanDebugOptionField } from "../contracts/HumanDebugOptionField";
import { HumanDebugOptions } from "../contracts/HumanDebugOptions";
import type { IHumanDebugCompilerState } from "../contracts/IHumanDebugCompilerState";
import type { IHumanDebugOptions } from "../contracts/IHumanDebugOptions";
import type { IHumanDebugPiece } from "../pieces/IHumanDebugPiece";
import { HumanDebugBatch } from "./HumanDebugBatch";
import { HumanDebugCaptureSession } from "./HumanDebugCaptureSession";
import { HumanDebugCompilerLog } from "./HumanDebugCompilerLog";
import { HumanDebugGenerationSlot } from "./HumanDebugGenerationSlot";
import { HumanDebugSourceHash } from "./HumanDebugSourceHash";
import { HumanDebugStackMap } from "./HumanDebugStackMap";
import type { IHumanDebugBatchItem } from "./IHumanDebugBatchItem";
import type { IHumanDebugEnvironment } from "./IHumanDebugEnvironment";
import type { IHumanDebugFrame } from "./IHumanDebugFrame";

/** Variables the image and batch routes read besides the frame options. */
const EXTRA: readonly string[] = ["fresh", "round", "cameras", "pieces", "keep"];

/**
 * The debug viewer's server routes: frames, batch renders, the registries and diagnostics.
 *
 * Every route answers under `HUMAN_DEBUG_ROUTES.prefix`; see `debug/README.md` for each. Every
 * failure is logged on the server and answered with its cause: a source change during a frame is
 * HTTP 503 with `retry-after`, a rejected request 400, anything else 500 with the message. The
 * registries are read through Vite's SSR loader, so the index and batch lists follow the source as
 * it stands. The image and batch routes draw from the
 * type-stripped source whatever the compile collector reports, and carry its latest cycle's
 * state in `x-human-compile` (`<phase> <cycle>`) as information.
 *
 * @param environment Server environment.
 * @returns The plugin.
 */
export function createHumanDebugPlugin(environment: IHumanDebugEnvironment): Plugin {
  let origin: string = "http://127.0.0.1:" + environment.port;
  let vite: ViteDevServer | undefined;
  const session: HumanDebugCaptureSession = new HumanDebugCaptureSession(
    environment,
    (): string => origin,
    (text: string): Promise<string> =>
      HumanDebugStackMap(text, async (served: string): Promise<string | null> => {
        // Vite's current transform map; it can differ from the page's executed module after a save.
        const map: { mappings?: string } | null | undefined = (await vite?.transformRequest(served))?.map;
        return typeof map?.mappings === "string" ? map.mappings : null;
      }),
  );
  return {
    name: "automovie-human-debug",
    apply: "serve",
    configureServer(server: ViteDevServer): void {
      vite = server;
      server.httpServer?.once("listening", (): void => {
        const address: ReturnType<NonNullable<typeof server.httpServer>["address"]> = server.httpServer!.address();
        if (address !== null && typeof address !== "string") origin = "http://127.0.0.1:" + address.port;
      });

      server.httpServer?.once("close", (): void => {
        void session.close().catch(console.error);
      });

      server.middlewares.use(HUMAN_DEBUG_ROUTES.prefix, (request: IncomingMessage, response: ServerResponse): void => {
        const url: URL = new URL(HUMAN_DEBUG_ROUTES.prefix + (request.url ?? "").replace(/^\//, ""), "http://localhost");
        void route(server, url, response).catch((error: unknown): void => {
          console.error("[human-debug]", url.pathname + url.search, error);
          const message: string = error instanceof Error ? error.message : String(error);
          const changed: boolean = /^Human source changed|closing/.test(message);
          if (changed) response.setHeader("retry-after", "2");
          send(response, changed ? 503 : 500, "text/plain; charset=utf-8", "Human debug request failed: " + message);
        });
      });
    },
  };

  /** Answer one request under the prefix. */
  async function route(server: ViteDevServer, url: URL, response: ServerResponse): Promise<void> {
    if (url.pathname === HUMAN_DEBUG_ROUTES.compiler) return json(response, HumanDebugCompilerLog(environment.checkLog));
    if (url.pathname === HUMAN_DEBUG_ROUTES.source)
      return json(response, { sourceSha256: await HumanDebugSourceHash(environment), observedUtc: new Date().toISOString() });
    if (url.pathname === HUMAN_DEBUG_ROUTES.status)
      return json(response, { pid: process.pid, ...session.status(), slots: HumanDebugGenerationSlot.holders(environment.slotRoot) });
    if (url.pathname === HUMAN_DEBUG_ROUTES.index) return json(response, await index(server));

    // A client that leaves before its frame starts takes the frame out of the queue.
    let gone: boolean = false;
    response.once("close", (): void => {
      if (!response.writableEnded) gone = true;
    });
    const left: () => boolean = (): boolean => gone;

    const parsed: { options: IHumanDebugOptions; notices: string[] } = HumanDebugOptions.parse(url.searchParams, EXTRA);
    if (parsed.notices.length !== 0) return send(response, 400, "text/plain; charset=utf-8", parsed.notices.join("\n"));
    const nonce: string | null = url.searchParams.get("fresh");

    const image: RegExpExecArray | null = new RegExp("^" + HUMAN_DEBUG_ROUTES.images + "([A-Za-z0-9_.-]+)\\.png$").exec(url.pathname);
    const batch: RegExpExecArray | null = new RegExp("^" + HUMAN_DEBUG_ROUTES.batch + "([A-Za-z_][A-Za-z0-9_]*)\\.json$").exec(url.pathname);

    // The compile collector's state rides along as information; the frame is drawn whatever it is.
    if (image !== null || batch !== null) {
      const compile: IHumanDebugCompilerState = HumanDebugCompilerLog(environment.checkLog);
      response.setHeader(HUMAN_DEBUG_ROUTES.headers.compile, compile.phase + " " + (compile.cycle ?? "no-cycle"));
    }

    if (image !== null) {
      // `keep=1` draws on the page's loaded source, so a series of frames shares one generation while files are saved.
      const frame: IHumanDebugFrame = await session.frame(parsed.options, nonce, url.searchParams.get("keep") === "1", left);
      const headers: typeof HUMAN_DEBUG_ROUTES.headers = HUMAN_DEBUG_ROUTES.headers;
      response.setHeader(headers.source, frame.source);
      response.setHeader(headers.cache, frame.cache);
      response.setHeader(headers.attempts, String(frame.attempts));
      response.setHeader(headers.png, frame.pngSha256);
      response.setHeader(headers.captured, frame.capturedUtc);
      response.setHeader(headers.query, frame.query);
      response.setHeader(headers.gpu, frame.snapshot.canvas.gpu);
      response.setHeader(headers.notices, encodeURIComponent(frame.snapshot.notices.join("\n")));

      // The subject's producer facts (stage timings, pose, counts), cut to stay inside header limits.
      response.setHeader(headers.provenance, encodeURIComponent(JSON.stringify(frame.snapshot.provenance)).slice(0, 7000));
      return send(response, 200, "image/png", frame.png);
    }

    if (batch !== null) {
      const round: string | null = url.searchParams.get("round");
      if (round === null || !/^[A-Za-z0-9_-]{1,64}$/.test(round))
        return send(response, 400, "text/plain; charset=utf-8", "round=<name> of letters, digits, _ and - is required");
      const cameras: { value: (keyof typeof HUMAN_DEBUG_CAMERAS)[] } | string = HumanDebugOptionField.words(
        Object.keys(HUMAN_DEBUG_CAMERAS) as (keyof typeof HUMAN_DEBUG_CAMERAS)[],
      ).read(url.searchParams.get("cameras") ?? Object.keys(HUMAN_DEBUG_CAMERAS).join(","));
      const pieces: { value: string[] } | string = HumanDebugOptionField.globs().read(url.searchParams.get("pieces") ?? "*");
      if (typeof cameras === "string" || typeof pieces === "string")
        return send(response, 400, "text/plain; charset=utf-8", "cameras: " + String(cameras) + "; pieces: " + String(pieces));
      const entries: (string | null)[] = HumanDebugBatch.select([null, ...(await index(server)).entries], pieces.value);
      const directory: string = path.join(environment.evidence, batch[1]!, round);
      const items: IHumanDebugBatchItem[] = await HumanDebugBatch(
        session,
        directory,
        entries,
        cameras.value,
        { ...parsed.options, person: batch[1]! },
        nonce,
        url.searchParams.get("keep") === "1",
        left,
      );
      return json(response, { person: batch[1], round, directory, items });
    }
    send(response, 404, "text/plain; charset=utf-8", "Unknown Human debug route " + url.pathname);
  }

  /** The registries as the source stands: people, pieces with their entries, cameras and regions. */
  async function index(server: ViteDevServer): Promise<{
    people: string[];
    pieces: { name: string; region: string; description: string; arguments: string[] }[];
    entries: string[];
    cameras: string[];
    regions: Record<string, readonly string[]>;
  }> {
    const people: { HumanDebugPeople: { aliases(): string[] } } = (await server.ssrLoadModule("/debug/people/HumanDebugPeople.ts")) as {
      HumanDebugPeople: { aliases(): string[] };
    };
    const registry: { HUMAN_DEBUG_PIECES: readonly IHumanDebugPiece[] } = (await server.ssrLoadModule(
      "/debug/pieces/HUMAN_DEBUG_PIECES.ts",
    )) as { HUMAN_DEBUG_PIECES: readonly IHumanDebugPiece[] };
    const regions: { HUMAN_DEBUG_REGIONS: Record<string, readonly string[]> } = (await server.ssrLoadModule(
      "/debug/contracts/HUMAN_DEBUG_REGIONS.ts",
    )) as { HUMAN_DEBUG_REGIONS: Record<string, readonly string[]> };
    return {
      people: people.HumanDebugPeople.aliases(),
      pieces: registry.HUMAN_DEBUG_PIECES.map((piece: IHumanDebugPiece): { name: string; region: string; description: string; arguments: string[] } => ({
        name: piece.name,
        region: piece.region,
        description: piece.description,
        arguments: piece.arguments,
      })),

      // A piece that needs an argument and registers none (the free chain list) has no batch entry.
      entries: registry.HUMAN_DEBUG_PIECES.flatMap((piece: IHumanDebugPiece): string[] =>
        piece.arguments.length !== 0
          ? piece.arguments.map((argument: string): string => piece.name + ":" + argument)
          : piece.region === "body"
            ? []
            : [piece.name],
      ),
      cameras: Object.keys(HUMAN_DEBUG_CAMERAS),
      regions: regions.HUMAN_DEBUG_REGIONS,
    };
  }
}

/** Answer JSON once. */
function json(response: ServerResponse, value: unknown): void {
  send(response, 200, "application/json", JSON.stringify(value, null, 2));
}

/** Answer once with a status, a type and a body. */
function send(response: ServerResponse, status: number, type: string, body: string | Buffer): void {
  if (response.headersSent) return;
  response.statusCode = status;
  response.setHeader("content-type", type);
  response.setHeader("cache-control", "no-store");
  response.end(body);
}
