import type { IncomingMessage, ServerResponse } from "node:http";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { type ViteDevServer, defineConfig } from "vite";

/** Scratch names belong to this production, including when its parent uses one. */
const productionRoot: string = fileURLToPath(new URL(".", import.meta.url));

/** Source tree of the installed Human package, whose calibrations the page caches. */
const humanSource: string = join(
  dirname(createRequire(import.meta.url).resolve("@automovie/human")),
  "src",
);

/** The production's own Node render integration, loaded through the server's own module loader because it is TypeScript source. */
type RenderNode = typeof import("./src/integrations/render/node/index");

/**
 * The development server's artifact routes: the production's artifact store
 * at `/__automovie/artifacts`, so the page reuses Human calibrations across
 * mounts, and at `/__automovie/sources` the digests of the code the page
 * draws with (Human's source for the calibration key, the production's own
 * source for the frame digest), recomputed on every request so an edit never
 * serves a stale identity.
 */
function artifacts(server: ViteDevServer): void {
  let loaded: Promise<RenderNode> | undefined;
  const node = (): Promise<RenderNode> =>
    (loaded ??= server.ssrLoadModule(
      "/src/integrations/render/node/index.ts",
    ) as Promise<RenderNode>);
  let store:
    | Promise<ReturnType<RenderNode["createAutoMovieArtifactMiddleware"]>>
    | undefined;
  const fail = (response: ServerResponse, error: unknown): void => {
    response.writeHead(500);
    response.end(String(error));
  };
  server.middlewares.use(
    "/__automovie/artifacts",
    (request: IncomingMessage, response: ServerResponse): void => {
      store ??= node().then(async (render: RenderNode) =>
        render.createAutoMovieArtifactMiddleware(
          await render.createAutoMovieDirectoryArtifactStore(
            join(productionRoot, ".cache", "artifacts"),
          ),
        ),
      );
      store.then(
        (serve) => serve(request, response),
        (error: unknown) => fail(response, error),
      );
    },
  );
  server.middlewares.use(
    "/__automovie/sources",
    (_request: IncomingMessage, response: ServerResponse): void => {
      node()
        .then((render: RenderNode) =>
          Promise.all([
            render.digestAutoMovieSourceTree([humanSource]),
            render.digestAutoMovieSourceTree([join(productionRoot, "src")]),
          ]),
        )
        .then(
          ([human, production]: string[]): void => {
            response.writeHead(200, {
              "content-type": "application/json",
              "cache-control": "no-store",
            });
            response.end(JSON.stringify({ human, production }));
          },
          (error: unknown) => fail(response, error),
        );
    },
  );
}

/** Running production viewer; generated evidence and capture scratch never reload it. */
export default defineConfig({
  build: { target: "es2022", chunkSizeWarningLimit: 4096 },
  plugins: [
    {
      name: "automovie-artifacts",
      configureServer: artifacts,
      // Render's Node entry names its own file through the CommonJS
      // `__filename`; the server's module loader runs it as ES modules, so the
      // name becomes the module's own path.
      transform: (
        code: string,
        id: string,
        options?: { ssr?: boolean },
      ): string | undefined =>
        options?.ssr === true && /\b__filename\b/.test(code)
          ? code.replace(/\b__filename\b/g, JSON.stringify(id.split("?")[0]))
          : undefined,
    },
  ],
  server: {
    host: "127.0.0.1",
    port: 5199,
    strictPort: true,
    // Workspace packages resolve through the repository root.
    fs: { allow: ["../../.."] },
    watch: {
      /** Match scratch components inside the project; ancestor names cannot hide source. */
      ignored: (file: string): boolean => {
        const local: string = relative(
          productionRoot,
          resolve(productionRoot, file),
        );
        if (isAbsolute(local) || local === ".." || local.startsWith(`..${sep}`))
          return false;
        return local
          .split(sep)
          .some(
            (component: string): boolean =>
              component === ".tmp" ||
              component === ".cache" ||
              component === "media",
          );
      },
    },
  },
});
