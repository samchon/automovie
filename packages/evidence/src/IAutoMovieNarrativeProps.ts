import type { IAutoMovieNarrativeClaim } from "./IAutoMovieNarrativeClaim";
import type { IProductionConstruction } from "./narrative/IProductionConstruction";
import type { IProductionLayerStages } from "./narrative/IProductionLayerStages";
import type { NarrativeScope } from "./narrative/NarrativeScope";

/**
 * Opts into the long-form or direct-screenplay evidence lifecycle.
 *
 * @evidence contracts/common.md#principled-implementation Mode chooses the actual inherited layers; omitted stages draft complete bodies with evidence disabled, and omitted scope selects the complete work.
 * @evidence contracts/common.md#clear-and-simple-design Author choices are separate from package-derived lifecycle and runtime identities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Partial stages supply defaults rather than waiving required creative passes or issuing an approval.
 * @evidence contracts/common.md#meaningful-documentation Fields state the defaults, short-route meaning, and exact claim ownership; the underlying stage and scope types retain their constraints.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A configuration type selects no processing strategy.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A configuration type owns no computation cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A configuration type acquires no resources.
 */
export interface IAutoMovieNarrativeProps {
  /** Long retains four layers; short enters at screenplay; short-with-settings first establishes compact canon without treatments, scripts or an outline. */
  mode: "long" | "short" | "short-with-settings";

  /** Unspecified layers are disabled drafts; an omitted outline follows settings. */
  construction?: Partial<IProductionConstruction>;

  /** An unspecified screenplay expression stage is disabled for drafting. */
  naturalness?: Partial<IProductionLayerStages>;

  /** Defaults to the complete work; a pilot must identify its exact first part. */
  scope?: NarrativeScope;

  /** Additional work-specific claims, each with its owning layer and pass. */
  claims?: IAutoMovieNarrativeClaim[];
}
