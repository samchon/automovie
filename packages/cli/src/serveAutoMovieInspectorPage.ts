import { findAutoMovieFreePort } from "./findAutoMovieFreePort";
import { planAutoMovieModulePageViteConfig } from "./planAutoMovieModulePageViteConfig";
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
 * The page is written by `writeAutoMovieModulePage`, as the draw page is: one `div` and a script that calls `@automovie/viewer`'s `AutoMovieViewerInspector.mountPage` with the module's `subjects` called on `props` and the window's `location` and `history`, the same call the scaffold's own page makes. The development server takes `planAutoMovieModulePageViteConfig`: the production's `vite.config.ts` and `public` folder and the page as the dependency scanner's entry, so dependencies are pre-bundled before the first load; listens on 127.0.0.1 at `port` or a free port with `strictPort`, and transforms the production's sources on request, so an edit is seen on the next reload.
 *
 * The script also passes through the host's capture command prefix when supplied.
 *
 * It rejects when the module does not exist, naming it, and when the server cannot start, after deleting the scratch folder.
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

  /** Optional executable and fixed arguments for capturing this subject from `root`. */
  captureCommand?: readonly [string, ...string[]];
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
        `import { AutoMovieViewerInspector } from "@automovie/viewer";\nimport { subjects } from ${JSON.stringify(specifier)};\n\nAutoMovieViewerInspector.mountPage({\n  root: document.getElementById("root"),\n  subjects: subjects(${JSON.stringify(props.props ?? null)}),\n  location: window.location,\n  history: window.history,\n  captureCommand: ${JSON.stringify(props.captureCommand)},\n});\n`,
    });
  try {
    const port: number = props.port ?? (await findAutoMovieFreePort());
    const server: Awaited<ReturnType<IVite["createServer"]>> =
      await vite.createServer({
        ...planAutoMovieModulePageViteConfig(page),
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
