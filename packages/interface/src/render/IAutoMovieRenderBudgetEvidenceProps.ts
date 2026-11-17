import type { IAutoMovieRenderBudget } from "./IAutoMovieRenderBudget.js";
import type { IAutoMovieRenderBudgetAssessment } from "./IAutoMovieRenderBudgetAssessment.js";

/**
 * Tier budgets and supplied shot assessments for deterministic evidence assembly. autoMovieRenderBudgetEvidence sorts declared tiers and shot ids, hashes the supplied identities, and records not-run for no assessments. It cannot establish that the caller supplied every production shot.
 *
 * @evidence contracts/development/design.md#principled-representation It cannot establish that the caller supplied every production shot.
 * @evidence contracts/development/design.md#minimal-and-owned-surface autoMovieRenderBudgetEvidence exchanges tier, budgets, assessments; their canonical owner is this contract and their concrete meanings are documented on the members.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts It cannot establish that the caller supplied every production shot.
 * @evidence contracts/development/common.md#meaningful-documentation Tier budgets and supplied shot assessments for deterministic evidence assembly. autoMovieRenderBudgetEvidence sorts declared tiers and shot ids, hashes the supplied identities, and records not-run for no assessments. The prose and members document how autoMovieRenderBudgetEvidence interprets and admits these values.
 */
export interface IAutoMovieRenderBudgetEvidenceProps {
  /** Quality tier the job targeted. */
  tier: string;
  /** Budgets the production declares. */
  budgets: readonly IAutoMovieRenderBudget[] | undefined;
  /** One assessment per shot; order is normalized here. */
  assessments: readonly IAutoMovieRenderBudgetAssessment[];
}
