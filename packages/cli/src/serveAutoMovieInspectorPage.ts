import { findAutoMovieFreePort } from "./findAutoMovieFreePort";
import { writeAutoMovieModulePage } from "./writeAutoMovieModulePage";

/**
 * The part of the production's `vite` the inspector page calls, declared structurally so the command loads the production's own Vite at run time.
 */
interface IVite {
  createServer(config: object): Promise<{
    listen(): Promise<unknown>;
    close(): Promise<void>;
  }>;
}

/**
 * Serve the inspector page over a subject module with the production's Vite in development mode, and return its address and the call that stops it.
 *
 * The page is written by `writeAutoMovieModulePage`, as the draw page is: one `div` and a script that calls `@automovie/viewer`'s `mountAutoMovieInspectorPage` with the module's `subjects` called on `props` and the window's `location` and `history`, the same call the scaffold's own page makes. The development server uses the production's `vite.config.ts` and `public` folder, listens on 127.0.0.1 at `port` or a free port with `strictPort`, and transforms the production's sources on request, so an edit is seen on the next reload.
 *
 * It rejects when the module does not exist, naming it, and when the server cannot start, after deleting the scratch folder.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the page runs, which configuration serves it, where it listens and why a development server is used, what the return holds, and the refusals.
 * @evidence contracts/development/implementation.md#principled-implementation A person inspecting edits sources between looks, so the page is served by Vite's development server, which compiles each module when the page asks for it; capture draws a built page instead because it must not reload between cells.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Write the page, find a port, start the server; the inspector and the subjects are the page's.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The production's own page and configuration file are left untouched, and a taken port fails the start instead of moving to another.
 * @evidence contracts/development/implementation.md#efficient-algorithms One server for the command's life; Vite compiles what the page imports.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One page per command.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The server and the scratch folder are owned by the returned `close`, which stops one and deletes the other; a failed start deletes the folder before rejecting.
 */
export async function serveAutoMovieInspectorPage(props: {
  /** The production's root folder. */
  root: string;

  /** Path of the subject module, relative to `root` or absolute. */
  module: string;

  /** The production's `vite`. */
  vite: unknown;

  /** The port to listen on, or null for a free one. */
  port: number | null;

  /** The JSON value the module's `subjects` is called with, null for none. */
  props: unknown;
}): Promise<{
  /** Address of the inspector page, without a query. */
  url: string;

  /** Stop the server and delete the page. */
  close: () => Promise<void>;
}> {
  const vite: IVite = props.vite as IVite;
  const page: ReturnType<typeof writeAutoMovieModulePage> =
    writeAutoMovieModulePage({
      root: props.root,
      module: props.module,
      kind: "inspect",
      title: "AutoMovie inspector",
      body: `<div id="root"></div>`,
      script: (specifier: string): string =>
        `import { mountAutoMovieInspectorPage } from "@automovie/viewer";\nimport { subjects } from ${JSON.stringify(specifier)};\n\nmountAutoMovieInspectorPage({\n  root: document.getElementById("root"),\n  subjects: subjects(${JSON.stringify(props.props ?? null)}),\n  location: window.location,\n  history: window.history,\n});\n`,
    });
  try {
    const port: number = props.port ?? (await findAutoMovieFreePort());
    const server: Awaited<ReturnType<IVite["createServer"]>> =
      await vite.createServer({
        root: page.folder,
        configFile: page.configFile,
        publicDir: page.publicDir,
        logLevel: "warn",
        clearScreen: false,
        server: { host: "127.0.0.1", port, strictPort: true, open: false },
      });
    await server.listen();
    return {
      url: `http://127.0.0.1:${port}/`,
      close: async (): Promise<void> => {
        await server.close();
        page.remove();
      },
    };
  } catch (error) {
    page.remove();
    throw error;
  }
}
