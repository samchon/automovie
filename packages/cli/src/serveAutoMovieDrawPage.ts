import * as fs from "node:fs";
import * as net from "node:net";
import * as path from "node:path";
import { promisify } from "node:util";

/**
 * The part of the production's `vite` the capture host calls, declared structurally so the command loads the production's own Vite at run time.
 */
interface IVite {
  build(config: object): Promise<unknown>;
  preview(config: object): Promise<{
    resolvedUrls: { local: string[] } | null;
    httpServer: { close(callback: (error?: Error) => void): void };
  }>;
}

/**
 * Build a draw-only page for a subject module with the production's Vite, serve it with `vite preview`, and return its address and the call that stops the server and deletes the build.
 *
 * The page is generated in a scratch folder under `<root>/node_modules/.cache/automovie/`: an `index.html` with no interface and a script that calls `installAutoMovieDraw` with the module's `subjects` export. The build uses the production's `vite.config.ts` when it has one, with the generated page as the only input and the production's `public` folder as its public files, so a subject loads the assets and plugins the production's own page does. The preview listens on 127.0.0.1 at a free port with `strictPort`, so it never moves to another server's port.
 *
 * It rejects when the module does not exist, naming it, and when the build or the server fails, after deleting the scratch folder.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is generated and where, how the build is configured and why, where the server listens, what the return holds, and the refusals.
 * @evidence contracts/development/implementation.md#principled-implementation A built page served by `vite preview` does not rebuild or reload while pages draw, which the development server does on a new import; the scratch folder sits inside the production so bare imports resolve from its own dependencies.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Generate, build, find a port, preview; the draw function and subjects are the page's.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The production's page and configuration file are left untouched; the generated page replaces only the build input.
 * @evidence contracts/development/implementation.md#efficient-algorithms One build per host; every capture of the host reuses the served page.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The built page serves every subject and round of one host.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The server and the scratch folder are owned by the returned `close`, which stops one and deletes the other; a failed start deletes the folder before rejecting.
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
  const module: string = path.resolve(props.root, props.module);
  if (!fs.existsSync(module))
    throw new Error(`The subject module ${module} does not exist`);

  // The generated page, in a scratch folder of this process.
  const scratch: string = path.join(
    props.root,
    "node_modules",
    ".cache",
    "automovie",
    `draw-${process.pid}-${Date.now()}`,
  );
  fs.mkdirSync(scratch, { recursive: true });
  const relative: string = path
    .relative(scratch, module)
    .split(path.sep)
    .join("/")
    .replace(/\.tsx?$/u, "");
  fs.writeFileSync(
    path.join(scratch, "index.html"),
    `<!doctype html>\n<html><head><meta charset="utf-8" /><title>draw</title></head><body><script type="module" src="./main.js"></script></body></html>\n`,
  );
  fs.writeFileSync(
    path.join(scratch, "main.js"),
    `import { installAutoMovieDraw } from "@automovie/render";\nimport { subjects } from ${JSON.stringify(relative.startsWith(".") ? relative : `./${relative}`)};\n\ninstallAutoMovieDraw(subjects);\n`,
  );
  const remove: () => void = (): void =>
    fs.rmSync(scratch, { recursive: true, force: true });

  try {
    // The production's configuration, with the generated page as the only input.
    const config: string = path.join(props.root, "vite.config.ts");
    const publicDir: string = path.join(props.root, "public");
    const outDir: string = path.join(scratch, "dist");
    await vite.build({
      root: scratch,
      configFile: fs.existsSync(config) ? config : false,
      publicDir: fs.existsSync(publicDir) ? publicDir : false,
      base: "./",
      logLevel: "warn",
      clearScreen: false,
      build: {
        outDir,
        emptyOutDir: true,
        target: "es2022",
        reportCompressedSize: false,
        chunkSizeWarningLimit: Number.MAX_SAFE_INTEGER,
        rollupOptions: { input: path.join(scratch, "index.html") },
      },
    });

    const port: number = await freePort();
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
        await promisify(
          (done: (error?: Error) => void): void => server.httpServer.close(done),
        )();
        remove();
      },
    };
  } catch (error) {
    remove();
    throw error;
  }
}

/** A port the operating system reports free on 127.0.0.1 at the moment of asking. */
function freePort(): Promise<number> {
  return new Promise<number>(
    (resolve: (port: number) => void, reject: (error: Error) => void): void => {
      const server: net.Server = net.createServer();
      server.once("error", reject);
      server.listen(0, "127.0.0.1", (): void => {
        const address: net.AddressInfo = server.address() as net.AddressInfo;
        server.close((): void => resolve(address.port));
      });
    },
  );
}
