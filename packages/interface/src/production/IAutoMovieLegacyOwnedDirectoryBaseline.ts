import { IAutoMovieLegacyImportInventoryEntry } from "./IAutoMovieLegacyImportInventoryEntry";

/**
 * Exact pre-import state of one production-owned directory used to fence rollback.
 *
 * @evidence contracts/common.md#principled-implementation Captures physical directory existence, recursive subdirectories and exact file inventories before import; rollback compares this baseline so later source, generated or render work cannot be mistaken for removable import state.
 * @evidence contracts/common.md#clear-and-simple-design A closed three-directory path union fixes production ownership while shared inventory entries supply content identity; the containing plan orders src, generated and renders exactly once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An absent directory must have empty inventories, and canonical paths, case collisions and file-kind collisions are validated; rollback does not infer a clean baseline from an empty top-level listing.
 * @evidence contracts/common.md#meaningful-documentation Defines pre-import existence, project-relative physical subdirectories and recursive file content used by the rollback fence.
 * @author Samchon
 */
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
