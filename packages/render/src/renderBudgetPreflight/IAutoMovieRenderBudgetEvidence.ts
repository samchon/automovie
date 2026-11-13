import { IAutoMovieRenderBudgetAssessment } from "./IAutoMovieRenderBudgetAssessment.js";

/**
 * One caller-supplied tier's budget evidence over its supplied shot assessments. The record itself proves neither complete shot coverage nor actual rendering or publication.
 *
 * @evidence contracts/development/design.md#principled-representation A versioned tier envelope sorts shot assessments, names declared tiers and orders over, not-run, incomplete and within outcomes, with empty populations reported not-run.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The document is the stable publication unit for job-level budget evidence and delegates measurements to its shot assessments.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An undeclared tier remains explicitly unbudgeted, and no assessment population is treated as a successful measurement when empty.
 * @evidence contracts/development/common.md#meaningful-documentation Members state protocol identity, severity order, tier ordering, empty-population behavior and verdict-based digest scope.
 */
export interface IAutoMovieRenderBudgetEvidence {
  /**
   * Evidence format.
   */
  version: 1;

  /**
   * Versioned evidence protocol.
   */
  protocol: "automovie.render-budget-evidence.v1";

  /**
   * Quality tier the job targeted.
   */
  tier: string;

  /**
   * Every tier the production declared, ascending.
   *
   * A job that found no budget for its own tier reads as `unbudgeted`, and this
   * is what tells a mistyped tier apart from a production that deliberately
   * declares none.
   */
  declaredTiers: string[];

  /**
   * Whether a budget was found for {@link tier}.
   */
  budgeted: boolean;

  /**
   * The worst outcome any shot produced.
   *
   * `over` beats `not-run`, which beats `incomplete`, which beats `within`. This aggregate states the supplied outcomes; autoMovieRenderBudgetRefusal returns text for over-limit and required-texture gaps, but no current job consumer automatically enforces it.
   *
   * A document over no shots at all is `not-run`, never `within`: nothing was
   * measured, and a verdict over an empty set is the cheapest way a report ends
   * up clearing a production it never read.
   */
  status: IAutoMovieRenderBudgetAssessment["status"];

  /**
   * One assessment per shot, ascending by shot id.
   */
  shots: IAutoMovieRenderBudgetAssessment[];

  /**
   * Digest over protocol, tier, declared tiers, aggregate status and ordered shot id/status/report-digest/target-digest tuples; full report and target values are represented only by their supplied digests.
   */
  digest: string;
}
