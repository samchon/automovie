

/**
 * Input for one authored layer's distributed obligation coverage.
 *
 * @evidence contracts/common.md#principled-implementation Layer, host selectors, obligation routes and enabled state determine distributed authored H2 coverage.
 * @evidence contracts/common.md#clear-and-simple-design One input keeps account construction aligned with the selected layer population.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts There is no ignored review input; the builder fixes native review freshness to false.
 * @evidence contracts/common.md#meaningful-documentation Selectors and obligation paths are docs-relative and duplicate or cross-layer declarations are rejected.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration is erased; createAutoMoviePopulationAccountClaims validates selectors and creates claim records, which owns the runtime algorithm and allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no effects; createAutoMoviePopulationAccountClaims validates selectors and creates claim records, which owns any valid reuse or recomputation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resources; createAutoMoviePopulationAccountClaims validates selectors and creates claim records, while the caller or module owns the lifetime of its values.
 *
 * @author Samchon
 */
export interface IAutoMoviePopulationAccountClaimsProps {
  /** Authored branch whose H2 population collectively fulfills obligations. */
  layer: string;

  /** Docs-relative authored glob selectors confined to that branch. */
  populationFiles: readonly string[];

  /** Shared obligation documents answered by relevant H2 owners. */
  obligationFiles: readonly string[];

  /** Whether the branch currently enforces evidence. */
  enabled: boolean;
}
