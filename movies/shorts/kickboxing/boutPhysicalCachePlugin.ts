import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";

import { boutPhysicalSourceIdentity } from "./src/physics/boutPhysicalSourceIdentity";
import { copyBoutPhysicalArchives } from "./src/physics/copyBoutPhysicalArchives";

/** Expose only this production's precomputed archives, and independently bind them to current numerical source. */
export function boutPhysicalCachePlugin(): Plugin {
  const root: string = import.meta.dirname;
  const directory: string = path.join(root, ".cache/physical");
  const virtual: string = "virtual:bout-physical-source";
  return {
    name: "bout-physical-cache",
    resolveId: (id: string): string | undefined =>
      id === virtual ? `\0${virtual}` : undefined,
    load: async (id: string): Promise<string | undefined> =>
      id === `\0${virtual}`
        ? `export default ${JSON.stringify(await boutPhysicalSourceIdentity())};`
        : undefined,
    configureServer: (server: ViteDevServer): void => {
      server.watcher.on("change", (): void => {
        const module: ReturnType<typeof server.moduleGraph.getModuleById> =
          server.moduleGraph.getModuleById(`\0${virtual}`);
        if (module) server.moduleGraph.invalidateModule(module);
      });
      server.middlewares.use((request, response, next): void => {
        const name: string | undefined = request.url
          ?.split("?")[0]
          ?.match(/^\/\.physical\/([a-z][a-z0-9-]*\.amphys(?:\.json)?)$/)?.[1];
        if (!name) {
          next();
          return;
        }
        const file: string = path.join(directory, name);
        void stat(file)
          .then((info: Awaited<ReturnType<typeof stat>>): void => {
            if (!info.isFile()) {
              response.statusCode = 404;
              response.end();
              return;
            }
            response.setHeader(
              "Content-Type",
              name.endsWith(".json")
                ? "application/json"
                : "application/octet-stream",
            );
            response.setHeader("Cache-Control", "no-store");
            response.setHeader("Content-Length", info.size);
            const stream: ReturnType<typeof createReadStream> =
              createReadStream(file);
            stream.on("error", (error: Error): void => {
              response.destroy(error);
            });
            stream.pipe(response);
          })
          .catch((): void => {
            response.statusCode = 404;
            response.end("Run pnpm physics to prepare this performance");
          });
      });
    },
    closeBundle: async (): Promise<void> => {
      const destination: string = path.join(root, "dist/.physical");
      await copyBoutPhysicalArchives(directory, destination);
    },
  };
}
