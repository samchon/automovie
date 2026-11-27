import type { IAutoMovieProductionCheck } from "@automovie/interface";
import { loadProductionModule } from "./internal/loadProductionModule";
import { readRevisionImplementation } from "./internal/readRevisionImplementation";
import { runProductionCheck } from "./internal/runProductionCheck";

/** Public production operations for the CLI. */
export namespace AutoMovieCliProduction {
  /** Input admitted by the production-check operation. */
  export interface IRunCheckInput {
    /** Absolute production directory, resolving inputs and owned observations. */
    readonly root: string;

    /** The installed capture host's environment. */
    readonly env: Readonly<Record<string, string | undefined>>;

    /** Subjects defined by this production. */
    readonly targets: readonly IAutoMovieProductionCheck[];

    /** Explicit workload and optional gate. */
    readonly options: {
      subjects: string[];
      only: string[];
      require: string | null;
      run: boolean;
    };

    /** Resolve the source hashes used to identify a measurement input. */
    readonly measurementSources?: (
      file: string | undefined,
    ) => ReadonlyMap<string, string>;
  }

  /**
   * Read the source revision recorded by capture and delivery: the production's
   * Git commit with `+changes` when its working tree differs, or `unrecorded`
   * when the folder is not a Git checkout or Git is unavailable.
   */
  export function readRevision(root: string): string {
    return readRevisionImplementation(root);
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
    props: AutoMovieCliProduction.IRunCheckInput,
  ): Promise<IAutoMovieProductionCheck.IReport> {
    return runProductionCheck(props);
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
    return loadProductionModule<T>(root, id);
  }
}