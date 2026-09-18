import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * One exact legacy path considered by a production import plan.
 *
 * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `IAutoMovieLegacyImportInventoryEntry` as the portable data boundary for the operations resume compatibility classification requirement.
 * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `IAutoMovieLegacyImportInventoryEntry` for the execution resume compatibility system contract.
 */
export interface IAutoMovieLegacyImportInventoryEntry {
  /**
   * Legacy-root-relative canonical POSIX path.
   *
   * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `path` as the portable data boundary for the operations resume compatibility classification requirement.
   * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `path` for the execution resume compatibility system contract.
   */
  path: string;
  /**
   * Exact bytes, or zero when a registered asset is absent.
   *
   * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `bytes` as the portable data boundary for the operations resume compatibility classification requirement.
   * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `bytes` for the execution resume compatibility system contract.
   */
  bytes: number;
  /**
   * Exact content digest, or null when a registered asset is absent.
   *
   * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `digest` as the portable data boundary for the operations resume compatibility classification requirement.
   * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `digest` for the execution resume compatibility system contract.
   */
  digest: AutoMovieContentDigest | null;
  /**
   * Why this file belongs to the import boundary.
   *
   * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `kind` as the portable data boundary for the operations resume compatibility classification requirement.
   * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `kind` for the execution resume compatibility system contract.
   */
  kind: "project" | "asset";
}
