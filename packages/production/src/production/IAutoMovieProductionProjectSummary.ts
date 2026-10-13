/**
 * The selected resident production and the project generation it opened.
 *
 * Project inspection returns this summary after root and namespace admission.
 * The absolute root locates this handle and is not a portable result identity;
 * productionId selects the namespace whose revision is reported. The sorted
 * registration population lets a host make an explicit namespace choice.
 *
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
