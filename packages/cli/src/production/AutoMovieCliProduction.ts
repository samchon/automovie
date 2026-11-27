import { loadAutoMovieProductionModule } from "./internal/loadAutoMovieProductionModule";
import { readAutoMovieRevision } from "./internal/readAutoMovieRevision";
import { runAutoMovieProductionCheck } from "./internal/runAutoMovieProductionCheck";

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
  * Evaluate selected targets in declaration order. A status read uses available
  * records and actual bytes. An explicit run executes only the chosen enabled
  * checks and writes a local receipt for each completed measurement or capture
  * refresh. A required stage includes its omitted and unselected required IDs in
  * the same report, so filtering cannot turn missing work into a pass.
  *
  * @param props Production root, admitted command selection and editable
  *   targets.
  * @returns Current results and whether the requested stage is blocked.
  * @throws When target/check IDs or the requested scope are not usable.
  */
  export function runCheck(
    props: Parameters<typeof runAutoMovieProductionCheck>[0],
  ): ReturnType<typeof runAutoMovieProductionCheck> {
    return runAutoMovieProductionCheck(props);
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