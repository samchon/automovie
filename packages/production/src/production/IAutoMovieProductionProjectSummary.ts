/**
 * The selected resident production and the project generation it opened.
 *
 * Project inspection returns this summary after root and namespace admission.
 * The absolute root locates this handle and is not a portable result identity;
 * productionId selects the namespace whose revision is reported. The sorted
 * registration population lets a host make an explicit namespace choice.
 *
 * @evidence requirements/agent-authoring/partial-work.md#agent-resumable-authoring Reports the selected root, namespace and current revision a new session can inspect without prior agent memory.
 * @evidence specifications/authoring-and-authority/partial-targets-and-atomic-results.md#spec-authoring-partial-resume-compatibility Identifies the resident project generation selected for inspection while preserving the complete registered namespace population.
 * @author Samchon
 */
export interface IAutoMovieProductionProjectSummary {
  /** Absolute active root of the admitted project handle. */
  root: string;

  /** Exact active production inside the project. */
  productionId: string;

  /** Every registered production, in portable code-unit order. */
  productions: string[];

  /** Production manifest format. */
  formatVersion: number;

  /** Current monotonic revision. */
  revision: number;

  /** True when this call initialized a fresh production manifest. */
  initialized: boolean;
}
