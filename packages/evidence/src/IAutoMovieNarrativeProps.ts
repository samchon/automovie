import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IProductionConstruction } from "./narrative/IProductionConstruction";
import type { IProductionLayerStages } from "./narrative/IProductionLayerStages";
import type { NarrativeScope } from "./narrative/NarrativeScope";

/**
 * Opts into narrative evidence using native claims and selected authored stages.
 *
 * @evidence contracts/common.md#principled-implementation Mode chooses the actual layers; omitted stages remain disabled drafts, and omitted scope selects the complete work.
 * @evidence contracts/common.md#clear-and-simple-design Narrative options extend the engineering configuration without a parallel claim-owner representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Additional claims use the native Evidence shape and preserve their own selectors, references and review settings.
 * @evidence contracts/common.md#meaningful-documentation Fields define the route, stage defaults, authored scope and ordinary additional claims.
 * @evidence contracts/performance.md#efficient-algorithms This erased interface chooses no algorithm; composition owns runtime traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work This erased interface coordinates no computation or retained cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources This erased interface owns no handles, tasks or resource lifetime.
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

  /** Additional native claims for the production's actual respondents. */
  claims?: IEvidenceClaim[];
}
