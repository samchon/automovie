import { createHash } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";

import { normalizeHumanCurves } from "../human/normalizeHumanCurves";
import { normalizeHumanView } from "../human/normalizeHumanView";
import { HumanImageArchive } from "./HumanImageArchive";
import { HumanImageRegistry } from "./HumanImageRegistry";
import { HumanImageSession } from "./HumanImageSession";

/** Publish typed Human example JSON, generated models and rendered PNGs.
 * Both /human-parameters/f1.json and /human-images/f1.json use the same typed
 * source registry. Model JSON and PNG requests go through HumanImageSession
 * to the resident worker, whose Chrome runs the same /human.html. Historical
 * captures remain historical and never stand in for a current-source render.
 *
 * @evidence contracts/common.md#principled-implementation JSON routes serialize the registered typed parameters; model and PNG requests return worker output whose identity the session verified, and a worker failure propagates as an HTTP error.
 * @evidence contracts/common.md#clear-and-simple-design One existing middleware owns alias JSON and retained image transport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No old model or synthetic output replaces a failed generation or render.
 * @evidence contracts/common.md#meaningful-documentation States both typed JSON paths and the worker-served model and PNG routes.
 * @evidence contracts/performance.md#efficient-algorithms JSON publication reads only the small registry and serializes one example, without GPU work.
 * @evidence contracts/performance.md#reuse-equivalent-work Both JSON paths share HumanImageRegistry; archive bytes retain their original capture identity.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Existing archive/session owners close on server disposal; this middleware adds no separate listener or result cache.
 */
export function createHumanImagePlugin(repository: string): Plugin {
  const archive: HumanImageArchive = new HumanImageArchive();
  let session: HumanImageSession | undefined;
  let current:
    | {
        key: string;
        input: Awaited<ReturnType<typeof HumanImageRegistry.read>>;
      }
    | undefined;

  /**
   * Serve `/human-curves/<alias>.png` (or `.svg`), optionally `/human-curves/<alias>/<id>.png`, from the resident page.
   *
   * The path id, when present, is the first curve; repeated `curves=` keys and
   * comma lists follow in order. Headers and `fresh`/`receipt` follow the frame
   * rules; diagrams are not archived, so a repeated nonce returns the cached
   * diagram only while it is still among the 32 the session keeps.
   */
  async function serveDiagram(
    url: URL,
    response: ServerResponse,
  ): Promise<void> {
    const route: RegExpExecArray | null =
      /^\/human-curves\/([a-z][a-z0-9-]{0,15})(?:\/(.+))?\.(png|svg)$/.exec(
        url.pathname,
      );
    const registry: string | undefined =
      process.env.AUTOMOVIE_HUMAN_IMAGE_REGISTRY;
    if (route === null || !registry) {
      response.statusCode = route === null ? 404 : 503;
      response.end(
        route === null ? "" : "Human image registry is not configured",
      );
      return;
    }
    let curves: string;
    try {
      curves = normalizeHumanCurves([
        ...(route[2] === undefined ? [] : [decodeURIComponent(route[2])]),
        ...url.searchParams.getAll("curves"),
      ]);
      if (curves === "") throw new Error("Human curve diagram needs curves=");
    } catch (error) {
      response.statusCode = 400;
      response.end(error instanceof Error ? error.message : String(error));
      return;
    }

    // The alias must be registered; its parameters only scale the legend.
    await HumanImageRegistry.read(
      path.resolve(repository, registry),
      route[1]!,
    );
    const format: "png" | "svg" = route[3] === "svg" ? "svg" : "png";
    const result: Awaited<ReturnType<HumanImageSession["diagram"]>> =
      await session!.diagram(
        route[1]!,
        curves,
        format,
        url.searchParams.get("fresh") ?? undefined,
      );
    response.setHeader("cache-control", "no-store");
    response.setHeader("x-human-captured-utc", result.capturedUtc);
    response.setHeader(
      "x-human-fresh-nonce",
      url.searchParams.get("fresh") ?? "none",
    );
    response.setHeader("x-human-identity", result.key);
    response.setHeader(
      format === "png" ? "x-human-png-sha256" : "x-human-svg-sha256",
      result.sha256,
    );
    response.setHeader(
      "x-human-cache",
      result.cacheHit ? "existing-png" : "new-requested-frame",
    );
    response.setHeader("x-human-binding", "current-generation");
    response.setHeader("x-human-curves", normalizeHumanCurves.query(curves));
    if (url.searchParams.get("receipt") === "1") {
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify(result.receipt));
      return;
    }
    response.setHeader(
      "content-type",
      format === "png" ? "image/png" : "image/svg+xml",
    );
    response.end(result.bytes);
  }
  return {
    name: "automovie-human-images",
    async configureServer(server: ViteDevServer): Promise<void> {
      const published: string | undefined =
        process.env.AUTOMOVIE_HUMAN_AUDIT_IMPORT;
      if (published !== undefined) {
        const paths: string[] = published.trim().startsWith("[")
          ? (JSON.parse(published) as string[])
          : [published];
        if (
          paths.length > 2 ||
          !paths.length ||
          paths.some((value: string): boolean => typeof value !== "string")
        )
          throw new Error("Audit import expects one or two explicit paths");
        for (const filename of paths)
          await archive.import(path.resolve(repository, filename));
      }
      session = new HumanImageSession(server, repository);

      // The worker child inherits this environment when the first request
      // starts it, after listening, and opens /human.html on this origin.
      server.httpServer?.once("listening", (): void => {
        const address: ReturnType<
          NonNullable<typeof server.httpServer>["address"]
        > = server.httpServer!.address();
        if (address === null || typeof address === "string") return;
        const host: string =
          address.family === "IPv6"
            ? "[" + address.address + "]"
            : address.address;
        process.env.AUTOMOVIE_HUMAN_WORKER_ORIGIN =
          "http://" + host + ":" + address.port;
      });
      server.httpServer?.once("close", (): void => {
        archive.close();
        void session?.close().catch(console.error);
      });
      server.middlewares.use(
        (
          request: IncomingMessage,
          response: ServerResponse,
          next: () => void,
        ): void => {
          const url: URL = new URL(request.url ?? "/", "http://localhost");
          if (
            !url.pathname.startsWith("/human-images/") &&
            !url.pathname.startsWith("/human-parameters/") &&
            !url.pathname.startsWith("/human-curves/")
          ) {
            next();
            return;
          }
          const handle: () => Promise<void> = async (): Promise<void> => {
            if (request.method !== "GET" && request.method !== "POST") {
              response.statusCode = 405;
              response.end();
              return;
            }
            if (url.pathname.startsWith("/human-curves/")) {
              await serveDiagram(url, response);
              return;
            }
            if (request.method === "GET") {
              response.setHeader("cache-control", "no-store");
              if (url.pathname === "/human-images/archive.json") {
                response.setHeader("content-type", "application/json");
                response.end(
                  JSON.stringify({
                    binding: "historical-generation",
                    entries: archive.index(),
                  }),
                );
                return;
              }
              const immutable: RegExpExecArray | null =
                /^\/human-images\/archive\/([a-f0-9]{64})\.png$/.exec(
                  url.pathname,
                );
              const historical: ReturnType<HumanImageArchive["read"]> =
                immutable
                  ? archive.read(immutable[1]!)
                  : url.searchParams.has("fresh")
                    ? archive.find(url.href)
                    : undefined;
              if (immutable && !historical) {
                response.statusCode = 410;
                response.end(
                  "Historical capture expired or is not admitted; no rendering was performed",
                );
                return;
              }
              if (historical !== undefined) {
                response.setHeader("x-human-identity", historical.summary.key!);
                response.setHeader(
                  "x-human-captured-utc",
                  historical.summary.capturedUtc!,
                );
                response.setHeader(
                  "x-human-png-sha256",
                  historical.summary.pngSha256!,
                );
                response.setHeader("x-human-cache", "existing-png");
                response.setHeader("x-human-binding", "historical-generation");
                response.setHeader(
                  "x-human-archive-url",
                  historical.summary.url!,
                );
                response.setHeader(
                  "content-type",
                  url.searchParams.get("receipt") === "1"
                    ? "application/json"
                    : "image/png",
                );
                response.end(
                  url.searchParams.get("receipt") === "1"
                    ? historical.receipt
                    : historical.png,
                );
                return;
              }
            }
            const registry: string | undefined =
              process.env.AUTOMOVIE_HUMAN_IMAGE_REGISTRY;
            if (!registry) {
              response.statusCode = 503;
              response.end("Human image registry is not configured");
              return;
            }
            const pinned: RegExpExecArray | null =
              /^\/human-images\/current\/([a-f0-9]{64})\/([a-z0-9.-]+\.png)$/.exec(
                url.pathname,
              );
            const model: RegExpExecArray | null =
              /^\/human-images\/([a-z][a-z0-9-]{0,15})\.model\.json$/.exec(
                url.pathname,
              );
            const json: RegExpExecArray | null =
              /^\/(?:human-images|human-parameters)\/([a-z][a-z0-9-]{0,15})\.json$/.exec(
                url.pathname,
              );
            const image: RegExpExecArray | null =
              /^\/human-images\/([a-z][a-z0-9-]{0,15})\/((?:free|whole-(?:front|back|left|right|oblique-front|oblique-back)|region-row[0-3]-(?:front|side)|head-(?:front|side|back|oblique-front)|eye-(?:left|right)-front)\.(?:surface|overlay|construction)\.png)$/.exec(
                url.pathname,
              );
            if (
              !json &&
              !image &&
              !model &&
              !pinned &&
              url.pathname !== "/human-images/model.json"
            ) {
              response.statusCode = 404;
              response.end();
              return;
            }
            let input: Awaited<ReturnType<typeof HumanImageRegistry.read>>;
            if (pinned) {
              if (current?.key !== pinned[1]) {
                response.statusCode = 409;
                response.end("Reload the current Human model");
                return;
              }
              input = current.input;
            } else if (
              request.method === "POST" &&
              url.pathname === "/human-images/model.json"
            ) {
              const chunks: Buffer[] = [];
              let size: number = 0;
              for await (const chunk of request) {
                const bytes: Buffer = Buffer.from(chunk);
                size += bytes.length;
                if (size > 1_048_576)
                  throw new Error("Human input exceeds one MiB");
                chunks.push(bytes);
              }
              const value: Record<string, unknown> = JSON.parse(
                Buffer.concat(chunks).toString("utf8"),
              );
              if (
                !value.body ||
                !value.head ||
                Object.keys(value).some(
                  (key: string): boolean =>
                    ![
                      "body",
                      "head",
                      "extremities",
                      "supplement",
                      "appearance",
                      "pigmentation",
                      "pose",
                      "expression",
                    ].includes(key),
                )
              )
                throw new Error(
                  "Expected public Human parameters; only registered typed examples are admitted",
                );
              const bytes: Buffer = Buffer.from(JSON.stringify(value));
              input = {
                value,
                bytes,
                sha256: createHash("sha256").update(bytes).digest("hex"),
              };
            } else {
              if (request.method !== "GET" || (!json && !image && !model)) {
                response.statusCode = 405;
                response.end();
                return;
              }
              input = await HumanImageRegistry.read(
                path.resolve(repository, registry),
                (json ?? image ?? model)![1]!,
              );
            }
            response.setHeader("cache-control", "no-store");
            if (json && request.method === "GET") {
              response.setHeader("content-type", "application/json");
              response.end(input.bytes);
              return;
            }

            // Selection and free view join the frame identity in canonical form.
            let curves: string;
            let view: ReturnType<typeof normalizeHumanView>;
            try {
              curves = normalizeHumanCurves(url.searchParams.getAll("curves"));
              view = normalizeHumanView((name: string): string | null =>
                url.searchParams.get(name),
              );
            } catch (error) {
              response.statusCode = 400;
              response.end(
                error instanceof Error ? error.message : String(error),
              );
              return;
            }
            const requested: string = image?.[2] ?? pinned?.[2] ?? "$model";
            const result: Awaited<ReturnType<HumanImageSession["image"]>> =
              await session!.image(
                input,
                requested,
                url.searchParams.get("fresh") ?? undefined,
                curves,
                view.text,
              );
            if (pinned && result.key !== pinned[1]) {
              response.statusCode = 409;
              response.end("Human source changed; reload the model");
              return;
            }
            if (!image && !pinned) {
              current = { key: result.key, input };
              response.setHeader("content-type", "application/json");
              response.end(result.png);
              return;
            }
            if (
              image &&
              (
                await HumanImageRegistry.read(
                  path.resolve(repository, registry),
                  image![1]!,
                )
              ).sha256 !== input.sha256
            )
              throw new Error(
                "Published Human parameters changed during this request",
              );
            if (!result.capturedUtc || !result.pngSha256)
              throw new Error("Human PNG has no committed capture receipt");
            response.setHeader("x-human-captured-utc", result.capturedUtc);
            response.setHeader(
              "x-human-fresh-nonce",
              url.searchParams.get("fresh") ?? "none",
            );
            response.setHeader("x-human-identity", result.key);
            response.setHeader("x-human-png-sha256", result.pngSha256);
            response.setHeader(
              "x-human-cache",
              result.cacheHit ? "existing-png" : "new-requested-frame",
            );
            const event: object = {
              kind: "human-image-response",
              alias: image?.[1],
              image: requested,
              curves,
              view: view.text,
              key: result.key,
              cacheHit: result.cacheHit,
              ...(result.cacheHit ? {} : { receipt: result.receipt }),
            };
            const eventBytes: Buffer = Buffer.from(JSON.stringify(event));
            if (url.searchParams.has("fresh") && !result.cacheHit)
              response.setHeader(
                "x-human-archive-url",
                archive.publish(url.href, result.png, eventBytes),
              );
            response.setHeader("x-human-binding", "current-generation");
            response.setHeader(
              "x-human-curves",
              curves === "" ? "none" : normalizeHumanCurves.query(curves),
            );
            response.setHeader(
              "x-human-view",
              view.text === "" ? "none" : view.text,
            );
            console.info(eventBytes.toString("utf8"));
            if (url.searchParams.get("receipt") === "1") {
              response.setHeader("content-type", "application/json");
              response.end(JSON.stringify(result.receipt));
              return;
            }
            response.setHeader("content-type", "image/png");
            response.setHeader("x-human-identity", result.key);
            response.setHeader("x-human-png-sha256", result.pngSha256);
            response.setHeader(
              "x-human-cache",
              result.cacheHit ? "existing-png" : "new-requested-frame",
            );
            response.end(result.png);
          };
          void handle().catch((error: unknown): void => {
            console.error(error);
            const unavailable: boolean =
              error instanceof Error &&
              /host.*changed|source changed|closing/.test(error.message);
            response.statusCode = unavailable ? 503 : 500;
            if (unavailable) response.setHeader("retry-after", "1");
            response.end(
              unavailable
                ? "Human service generation changed; operator restart required"
                : "Human image request failed: " +
                    (error instanceof Error ? error.message : String(error)),
            );
          });
        },
      );
    },
    async closeBundle(): Promise<void> {
      archive.close();
      await session?.close();
    },
  };
}
