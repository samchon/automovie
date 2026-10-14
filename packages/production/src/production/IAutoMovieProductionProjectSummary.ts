/**
 * The selected resident production and the project generation it opened.
 *
 * Project inspection returns this summary after root and namespace admission. The absolute root locates this handle rather than a portable result identity; productionId selects the namespace whose revision is reported, and sorted registrations let the host choose explicitly. Opening metadata and current sequential revision/registry observations have distinct lifetimes.
 *
 * @evidence contracts/common.md#principled-implementation The admitted project supplies the exact namespace, monotonic revision and manifest format; sorted registrations expose ambiguity for the host to choose explicitly.
 * @evidence contracts/common.md#clear-and-simple-design This inspection projection carries only project selection and generation facts; portable result identities remain separate from the absolute resident root.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts initialized reports that opening first observed no registry; it does not report manifest creation by this summary call. No field selects a preferred namespace or guarantees a later revision remains unchanged.
 * @evidence contracts/common.md#meaningful-documentation Gives absolute versus portable identity, code-unit registration order, revision semantics and the initialization flag's meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface declares a summary; project admission, registration sorting and revision reads are owned by summary and the project constructor.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This is one inspection result and coordinates no repeated operation or cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns the scalar summary and registration list after return; it contains no project handle or open resource.
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

  /** Whether this handle's opening first observed an absent production registry. */
  initialized: boolean;
}
