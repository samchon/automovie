import { IAutoMovieDiagnostic } from "./IAutoMovieDiagnostic";
import { IAutoMovieLegacyImportInventoryEntry } from "./IAutoMovieLegacyImportInventoryEntry";
import { IAutoMovieLegacyOwnedDirectoryBaseline } from "./IAutoMovieLegacyOwnedDirectoryBaseline";
import { IAutoMovieLegacySourceTodo } from "./IAutoMovieLegacySourceTodo";
import { IAutoMovieProductionDesign } from "./IAutoMovieProductionDesign";
import { IAutoMovieShotContract } from "./IAutoMovieShotContract";

/**
 * Immutable, non-destructive interpretation of one resident legacy project.
 *
 * Drafts are evidence-backed starting points; applying the plan persists provenance and unresolved source TODOs without claiming that the production builder can already succeed.
 *
 * @evidence contracts/common.md#principled-implementation A domain-separated canonical JSON fingerprint covers every semantic member except itself, binding revision, exact legacy inventory, rollback baseline, conservative drafts and diagnostics into one immutable migration interpretation.
 * @evidence contracts/common.md#clear-and-simple-design Keeps recovered drafts and explicit source TODOs together with the captured evidence and rollback fence; active source authoring and later production compilation remain separate steps.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts assertAutoMovieLegacyImportPlan checks exact schema, safe revision, canonical inventories, ordered directory baselines and recomputed fingerprint; unrecoverable source is a TODO rather than invented executable content.
 * @evidence contracts/common.md#meaningful-documentation Defines non-destructive draft semantics, fingerprint coverage, revision, inventory, rollback ownership and unresolved source and diagnostic records.
 * @author Samchon
 */
export interface IAutoMovieLegacyImportPlan {
  /** Import-plan format. */
  version: 1;

  /** Domain-separated identity of every field below except this fingerprint. */
  fingerprint: string;

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
