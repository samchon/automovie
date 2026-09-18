import { IAutoMovieReviewTarget } from "./IAutoMovieReviewTarget";

/**
 * Consequences computed before one design mutation is committed.
 *
 * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `IAutoMovieDesignMutationConsequences` as the portable data boundary for the asset generation provider independence requirement.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `IAutoMovieDesignMutationConsequences` for the asset spec generation provider choice system contract.
 */
export interface IAutoMovieDesignMutationConsequences {
  /**
   * Review targets that become stale.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `staleReviews` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `staleReviews` for the asset spec generation provider choice system contract.
   */
  staleReviews: IAutoMovieReviewTarget[];
  /**
   * Render bundle ids that become stale.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `staleRenders` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `staleRenders` for the asset spec generation provider choice system contract.
   */
  staleRenders: string[];
  /**
   * Generated paths invalidated by the mutation.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `removedGenerated` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `removedGenerated` for the asset spec generation provider choice system contract.
   */
  removedGenerated: string[];
}
