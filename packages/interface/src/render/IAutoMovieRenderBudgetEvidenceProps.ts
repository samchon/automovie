import type { IAutoMovieRenderBudget } from "./IAutoMovieRenderBudget";
import type { IAutoMovieRenderBudgetAssessment } from "./IAutoMovieRenderBudgetAssessment";

/**
 * Tier budgets and supplied shot assessments for deterministic evidence
 * assembly. `AutoMovieRenderBudgetPreflight.budgetEvidence` sorts declared
 * tiers and shot ids, hashes the supplied identities, and records not-run for
 * no assessments. It cannot establish that the caller supplied every
 * production shot.
 */
export interface IAutoMovieRenderBudgetEvidenceProps {
  /** Quality tier the job targeted. */
  tier: string;
  /** Budgets the production declares. */
  budgets: readonly IAutoMovieRenderBudget[] | undefined;
  /** One assessment per shot; order is normalized here. */
  assessments: readonly IAutoMovieRenderBudgetAssessment[];
}
