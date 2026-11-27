import { findAutoMovieFreePort } from "./internal/findAutoMovieFreePort";
import { serveAutoMovieDrawPage } from "./internal/serveAutoMovieDrawPage";

/** Public page-serving operations for the CLI. */
export namespace AutoMovieCliPage {
  /**
   * Find a port the operating system reports free on 127.0.0.1 at the moment
   * of asking. The server listens with strictPort, so a race fails at startup.
   */
  export function findFreePort(): Promise<number> {
    return findAutoMovieFreePort();
  }

  /** Input for serving a subject draw page. */
  export interface IServeDrawPageInput {
    /** The production's root folder. */
    root: string;

    /** Path of the subject module, relative to `root` or absolute. */
    module: string;

    /** The production's `vite`. */
    vite: unknown;
  }

  /** Handle returned by the served subject draw page. */
  export interface IServeDrawPageHandle {
    /** Address of the draw page. */
    url: string;

    /** Stop the server and delete the build. */
    close: () => Promise<void>;
  }

  /**
   * Build a draw-only page for a subject module with the production's Vite, serve
   * it with `vite preview`, and return its address and the call that stops the
   * server and deletes the build.
   *
   * The page is generated in a scratch folder under
   * `<root>/node_modules/.cache/automovie/`: an `index.html` with no interface
   * and a script that calls `AutoMovieRenderDraw.installAutoMovieDraw` with the module's `subjects`
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
  export function serveDrawPage(
    props: AutoMovieCliPage.IServeDrawPageInput,
  ): Promise<AutoMovieCliPage.IServeDrawPageHandle> {
    return serveAutoMovieDrawPage(props);
  }
}
