import type { AutoMovieEvidenceStage } from "./AutoMovieEvidenceStage";
import type { AutoMoviePopulationScope } from "./AutoMoviePopulationScope";
import type { AutoMovieProductionContractLayer } from "./AutoMovieProductionContractLayer";
import type { AutoMovieProductionContractPass } from "./AutoMovieProductionContractPass";
import type { ITtscEvidenceGraphReference } from "@ttsc/evidence";

/**
 * Inputs for a production-local per-unit principle claim.
 *
 * A production keeps adopted rules in its flat `docs/contracts` inventory, while this declaration says which authored Markdown population answers those rules. The host stage is explicit so the local claim follows the same `draft -> evidence -> review` lifecycle as the shared graph rather than becoming an independently enabled side graph.
 *
 * @evidence contracts/common.md#principled-implementation A local principle declares contract documents, owned host selectors, pass, lifecycle stage and exact production scope.
 * @evidence contracts/common.md#clear-and-simple-design The explicit authored binding joins constructors with later canonical admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inapplicable is permitted only for first-pilot scope; arbitrary disabling cannot discharge a required local duty.
 * @evidence contracts/common.md#meaningful-documentation documentRoot defaults to docs, pass to construction, and symbol identifies H2/H3/H4 per-unit owners.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This declaration is erased; createAutoMovieProductionPrincipleClaim validates the caller's binding declaration, which owns the runtime algorithm and allocation cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type coordinates no effects; createAutoMovieProductionPrincipleClaim validates the caller's binding declaration, which owns any valid reuse or recomputation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The schema acquires no resources; createAutoMovieProductionPrincipleClaim validates the caller's binding declaration, while the caller or module owns the lifetime of its values.
 *
 * @author Samchon
 */
export interface IAutoMovieProductionContractClaimProps {
  /** Diagnostic identity stating what the selected hosts must establish. */
  name: string;

  /**
   * Production-local contract paths as hosts cite them.
   *
   * Several paths become several independent references, so every document retains its own complete H2 coverage obligation.
   */
  document: string | readonly string[];

  /**
   * Directory the contract paths resolve against.
   *
   * @default "docs"
   */
  documentRoot?: string;

  /** Markdown files whose selected units answer the contract. */
  files: readonly string[];

  /** Authored layer that owns every selected host file. */
  layer: AutoMovieProductionContractLayer;

  /** Stage of the authored layer that owns {@link files}. */
  stage: AutoMovieEvidenceStage;

  /**
   * Pass whose units answer this rule.
   *
   * Naturalness is valid only for screenplay hosts under `final/screenplays`; every other claim defaults to construction.
   *
   * @default "construction"
   */
  pass?: AutoMovieProductionContractPass;

  /** Exact production population to which this local relationship applies. */
  populationScope: AutoMoviePopulationScope;

  /** Authored H2/H3/H4 units that answer the principle for themselves. */
  symbol: Extract<ITtscEvidenceGraphReference, { type: "markdown" }>["symbol"];

  /**
   * Turns the claim off for a reason other than the host stage.
   *
   * Use this only when the contract itself is inapplicable to the declared production scope. A duty every realized host owes stays active regardless of how small that population is.
   *
   * @default false
   */
  inapplicable?: boolean;
}
