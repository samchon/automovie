import { IAutoMovieLegacyImportInventoryEntry } from "./IAutoMovieLegacyImportInventoryEntry";

/**
 * Exact pre-import state of one production-owned directory.
 *
 * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `IAutoMovieLegacyOwnedDirectoryBaseline` as the portable data boundary for the operations resume compatibility classification requirement.
 * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `IAutoMovieLegacyOwnedDirectoryBaseline` for the execution resume compatibility system contract.
 */
export interface IAutoMovieLegacyOwnedDirectoryBaseline {
  /**
   * Production-owned project-relative directory.
   *
   * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `path` as the portable data boundary for the operations resume compatibility classification requirement.
   * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `path` for the execution resume compatibility system contract.
   */
  path: "src" | "generated" | "renders";

  /**
   * Whether the directory existed when the import plan was captured.
   *
   * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `existed` as the portable data boundary for the operations resume compatibility classification requirement.
   * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `existed` for the execution resume compatibility system contract.
   */
  existed: boolean;

  /**
   * Exact recursive physical subdirectory inventory at capture time.
   *
   * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `directories` as the portable data boundary for the operations resume compatibility classification requirement.
   * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `directories` for the execution resume compatibility system contract.
   */
  directories: string[];

  /**
   * Exact recursive file inventory at capture time.
   *
   * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `files` as the portable data boundary for the operations resume compatibility classification requirement.
   * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `files` for the execution resume compatibility system contract.
   */
  files: IAutoMovieLegacyImportInventoryEntry[];
}
