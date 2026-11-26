import * as path from "node:path";
import { promisify } from "node:util";

import { findAutoMovieFreePort } from "./findAutoMovieFreePort";
import { planAutoMovieModulePageViteConfig } from "./production/internal/planAutoMovieModulePageViteConfig";
import { writeAutoMovieModulePage } from "./production/internal/writeAutoMovieModulePage";

/**
 * Build a draw-only page for a subject module with the production's Vite, serve
 * it with `vite preview`, and return its address and the call that stops the
 * server and deletes the build.
 *
 * The page is generated in a scratch folder under
 * `<root>/node_modules/.cache/automovie/`: an `index.html` with no interface
 * and a script that calls `installAutoMovieDraw` with the module's `subjects`
 * export. The build takes `planAutoMovieModulePageViteConfig`, the one
 * configuration both page hosts share: the production's `vite.config.ts` when
 * it has one and its `public` folder as its public files, with the generated
 * page as the only input, so a subject loads the assets and plugins the
 * production's own page does. The preview listens on 127.0.0.1 at a free port
 * with `strictPort`, so it never moves to another server's port.
 *
 * It rejects when the module does not exist, naming it, and when the build or
 * the server fails, after deleting the scratch folder.
 */
export async function serveAutoMovieDrawPage(props: {
  /** The production's root folder. */
  root: string;

  /** Path of the subject module, relative to `root` or absolute. */
  module: string;

  /** The production's `vite`. */
  vite: unknown;
}): Promise<{
  /** Address of the draw page. */
  url: string;

  /** Stop the server and delete the build. */
  close: () => Promise<void>;
}> {
  const vite: IVite = props.vite as IVite;

  // The generated page, in a scratch folder of this process.
  const page: ReturnType<typeof writeAutoMovieModulePage> =
    writeAutoMovieModulePage({
      root: props.root,
      module: props.module,
      kind: "draw",
      title: "draw",
      body: "",
      script: (specifier: string): string =>
        `import { installAutoMovieDraw } from "@automovie/render";\nimport { subjects } from ${JSON.stringify(specifier)};\n\ninstallAutoMovieDraw(subjects);\n`,
    });
  const scratch: string = page.folder;
  const remove: () => void = page.remove;

  try {
    // The production's configuration, with the generated page as the only input.
    const outDir: string = path.join(scratch, "dist");
    await vite.build({
      ...planAutoMovieModulePageViteConfig(page),
      base: "./",
      build: {
        outDir,
        emptyOutDir: true,
        target: "es2022",
        reportCompressedSize: false,
        chunkSizeWarningLimit: Number.MAX_SAFE_INTEGER,
        rollupOptions: { input: path.join(scratch, "index.html") },
      },
    });

    const port: number = await findAutoMovieFreePort();
    const server: Awaited<ReturnType<IVite["preview"]>> = await vite.preview({
      root: scratch,
      configFile: false,
      base: "./",
      logLevel: "warn",
      clearScreen: false,
      build: { outDir },
      preview: { host: "127.0.0.1", port, strictPort: true, open: false },
    });
    return {
      url: `http://127.0.0.1:${port}/index.html`,
      close: async (): Promise<void> => {
        await promisify((done: (error?: Error) => void): void =>
          server.httpServer.close(done),
        )();
        remove();
      },
    };
  } catch (error) {
    remove();
    throw error;
  }
}

/**
 * The part of the production's `vite` the capture host calls, declared
 * structurally so the command loads the production's own Vite at run time.
 */
interface IVite {
  build(config: object): Promise<unknown>;
  preview(config: object): Promise<{
    resolvedUrls: { local: string[] } | null;
    httpServer: { close(callback: (error?: Error) => void): void };
  }>;
}
