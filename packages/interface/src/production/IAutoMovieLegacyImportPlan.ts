import { IAutoMovieDiagnostic } from "./IAutoMovieDiagnostic";
import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieProductionDesign } from "./IAutoMovieProductionDesign";
import { IAutoMovieShotContract } from "./IAutoMovieShotContract";
import { IAutoMovieLegacyImportInventoryEntry } from "./IAutoMovieLegacyImportInventoryEntry";
import { IAutoMovieLegacyOwnedDirectoryBaseline } from "./IAutoMovieLegacyOwnedDirectoryBaseline";
import { IAutoMovieLegacySourceTodo } from "./IAutoMovieLegacySourceTodo";

/**
 * Immutable, non-destructive interpretation of one resident legacy project.
 *
 * Drafts are evidence-backed starting points, not active production truth.
 * Applying the plan persists this document and provenance without inventing
 * source or claiming that the production builder can already succeed.
 *
 * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `IAutoMovieLegacyImportPlan` as the portable data boundary for the operations resume compatibility classification requirement.
 * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `IAutoMovieLegacyImportPlan` for the execution resume compatibility system contract.
 */
export interface IAutoMovieLegacyImportPlan {
  /**
   * Import-plan format.
   *
   * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `version` as the portable data boundary for the operations resume compatibility classification requirement.
   * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `version` for the execution resume compatibility system contract.
   */
  version: 1;

  /**
   * Domain-separated identity of every field below except this fingerprint.
   *
   * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `fingerprint` as the portable data boundary for the operations resume compatibility classification requirement.
   * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `fingerprint` for the execution resume compatibility system contract.
   */
  fingerprint: AutoMovieContentDigest;

  /**
   * Legacy monotonic revision captured by this plan.
   *
   * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `legacyRevision` as the portable data boundary for the operations resume compatibility classification requirement.
   * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `legacyRevision` for the execution resume compatibility system contract.
   */
  legacyRevision: number;

  /**
   * Exact deterministic legacy byte inventory.
   *
   * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `inventory` as the portable data boundary for the operations resume compatibility classification requirement.
   * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `inventory` for the execution resume compatibility system contract.
   */
  inventory: IAutoMovieLegacyImportInventoryEntry[];

  /**
   * Trusted rollback fence for production-owned directories.
   *
   * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `rollbackBaseline` as the portable data boundary for the operations resume compatibility classification requirement.
   * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `rollbackBaseline` for the execution resume compatibility system contract.
   */
  rollbackBaseline: IAutoMovieLegacyOwnedDirectoryBaseline[];

  /**
   * Conservative production design draft with explicit default warnings.
   *
   * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `productionDraft` as the portable data boundary for the operations resume compatibility classification requirement.
   * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `productionDraft` for the execution resume compatibility system contract.
   */
  productionDraft: IAutoMovieProductionDesign;

  /**
   * Conservative shot contract drafts; their source modules remain TODOs.
   *
   * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `shotContractDrafts` as the portable data boundary for the operations resume compatibility classification requirement.
   * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `shotContractDrafts` for the execution resume compatibility system contract.
   */
  shotContractDrafts: IAutoMovieShotContract[];

  /**
   * Unrecoverable coding-agent source bindings.
   *
   * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `sourceTodos` as the portable data boundary for the operations resume compatibility classification requirement.
   * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `sourceTodos` for the execution resume compatibility system contract.
   */
  sourceTodos: IAutoMovieLegacySourceTodo[];

  /**
   * Import limitations and corrective actions.
   *
   * @evidence requirements/operations-and-recovery/migration-and-compatibility.md#operations-resume-compatibility-classification Exposes `diagnostics` as the portable data boundary for the operations resume compatibility classification requirement.
   * @evidence specifications/execution-and-recovery/portability-migration-and-compatibility.md#execution-resume-compatibility Types `diagnostics` for the execution resume compatibility system contract.
   */
  diagnostics: IAutoMovieDiagnostic[];
}
