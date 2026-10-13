import { IAutoMovieLegacyImportInventoryEntry } from "./IAutoMovieLegacyImportInventoryEntry";

/** Exact pre-import state of one production-owned directory. */
export interface IAutoMovieLegacyOwnedDirectoryBaseline {
  /** Production-owned project-relative directory. */
  path: "src" | "generated" | "renders";

  /** Whether the directory existed when the import plan was captured. */
  existed: boolean;

  /** Exact recursive physical subdirectory inventory at capture time. */
  directories: string[];

  /** Exact recursive file inventory at capture time. */
  files: IAutoMovieLegacyImportInventoryEntry[];
}
