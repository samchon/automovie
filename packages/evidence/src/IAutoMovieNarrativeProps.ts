import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IProductionConstruction } from "./narrative/IProductionConstruction";
import type { IProductionLayerStages } from "./narrative/IProductionLayerStages";
import type { NarrativeScope } from "./narrative/NarrativeScope";

/**
 * Opts into narrative evidence using native claims and selected authored stages.
 *
 * @evidence contracts/development/design.md#principled-representation Mode chooses the actual layers, or none when no story pass runs; omitted stages remain disabled drafts, and omitted scope selects the complete work.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Narrative options extend the engineering configuration without a parallel claim-owner representation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Additional claims use the native Evidence shape and preserve their own selectors, references and review settings.
 * @evidence contracts/development/common.md#meaningful-documentation Fields define the route, stage defaults, authored scope and ordinary additional claims.
 */
export interface IAutoMovieNarrativeProps {
  /**
   * Long retains four layers; short writes its brief canon, then the
   * screenplay, with no treatments, scripts or outline. None runs no story
   * pass, for a screenplay written without the workflow or fixed by the user:
   * no narrative claim is made, the stage and scope options are refused, and
   * an enabled composition stage realizes every instruction instead.
   */
  mode: "long" | "short" | "none";

  /** Unspecified layers are disabled drafts; an omitted outline follows settings. */
  construction?: Partial<IProductionConstruction>;

  /** An unspecified screenplay expression stage is disabled for drafting. */
  naturalness?: Partial<IProductionLayerStages>;

  /** Defaults to the complete work; a pilot must identify its exact first part. */
  scope?: NarrativeScope;

  /** Additional native claims for the production's actual respondents. */
  claims?: IEvidenceClaim[];
}
