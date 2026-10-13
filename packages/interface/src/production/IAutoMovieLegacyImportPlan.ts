import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieDiagnostic } from "./IAutoMovieDiagnostic";
import { IAutoMovieLegacyImportInventoryEntry } from "./IAutoMovieLegacyImportInventoryEntry";
import { IAutoMovieLegacyOwnedDirectoryBaseline } from "./IAutoMovieLegacyOwnedDirectoryBaseline";
import { IAutoMovieLegacySourceTodo } from "./IAutoMovieLegacySourceTodo";
import { IAutoMovieProductionDesign } from "./IAutoMovieProductionDesign";
import { IAutoMovieShotContract } from "./IAutoMovieShotContract";

/**
 * Immutable, non-destructive interpretation of one resident legacy project.
 *
 * Drafts are evidence-backed starting points, not active production truth.
 * Applying the plan persists this document and provenance without inventing
 * source or claiming that the production builder can already succeed.
 */
export interface IAutoMovieLegacyImportPlan {
  /** Import-plan format. */
  version: 1;

  /** Domain-separated identity of every field below except this fingerprint. */
  fingerprint: AutoMovieContentDigest;

  /** Legacy monotonic revision captured by this plan. */
  legacyRevision: number;

  /** Exact deterministic legacy byte inventory. */
  inventory: IAutoMovieLegacyImportInventoryEntry[];

  /** Trusted rollback fence for production-owned directories. */
  rollbackBaseline: IAutoMovieLegacyOwnedDirectoryBaseline[];

  /** Conservative production design draft with explicit default warnings. */
  productionDraft: IAutoMovieProductionDesign;

  /** Conservative shot contract drafts; their source modules remain TODOs. */
  shotContractDrafts: IAutoMovieShotContract[];

  /** Unrecoverable coding-agent source bindings. */
  sourceTodos: IAutoMovieLegacySourceTodo[];

  /** Import limitations and corrective actions. */
  diagnostics: IAutoMovieDiagnostic[];
}
