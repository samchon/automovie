import { loadAutoMovieProductionModule } from "./internal/loadAutoMovieProductionModule";
import { readAutoMovieRevision } from "./internal/readAutoMovieRevision";

/** Public production operations for the CLI. */
export namespace AutoMovieCliProduction {
  /**
   * Read the source revision recorded by capture and delivery: the production's
   * Git commit with `+changes` when its working tree differs, or `unrecorded`
   * when the folder is not a Git checkout or Git is unavailable.
   */
  export function readRevision(root: string): string {
    return readAutoMovieRevision(root);
  }

  /**
   * Load a package as the production at `root` resolves it, for optional peers
   * such as render, Vite, Playwright and FFmpeg.
   *
   * @param root The production's folder.
   * @param id The package to load.
   * @returns The package exports typed by T.
   */
  export function loadModule<T = unknown>(root: string, id: string): T {
    return loadAutoMovieProductionModule<T>(root, id);
  }
}