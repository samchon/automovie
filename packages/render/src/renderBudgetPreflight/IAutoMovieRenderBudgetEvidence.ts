import { IAutoMovieRenderBudgetAssessment } from "./IAutoMovieRenderBudgetAssessment";

/**
 * One caller-supplied tier's budget evidence over its supplied shot assessments. The record itself proves neither complete shot coverage nor actual rendering or publication.
 *
 * @evidence contracts/common.md#principled-implementation A versioned tier envelope sorts shot assessments, names declared tiers and orders over, not-run, incomplete and within outcomes, with empty populations reported not-run.
 * @evidence contracts/common.md#clear-and-simple-design The document is the stable publication unit for job-level budget evidence and delegates measurements to its shot assessments.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An undeclared tier remains explicitly unbudgeted, and no assessment population is treated as a successful measurement when empty.
 * @evidence contracts/common.md#meaningful-documentation Members state protocol identity, severity order, tier ordering, empty-population behavior and verdict-based digest scope.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The versioned budget publication shape declares data and chooses no runtime algorithm; its producer documents construction cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The tier verdict publication identity describes an identity boundary and performs no request coordination or result caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased publication envelope opens no renderer; autoMovieRenderBudgetEvidence shares assessment references into sorted output whose lifetime belongs to the evidence caller.
 *
 * @author Samchon
 */
export interface IAutoMovieRenderBudgetEvidence {
  /**
   * Evidence format.
   *
   * @author Samchon
   */
  version: 1;

  /**
   * Versioned evidence protocol.
   *
   * @author Samchon
   */
  protocol: "automovie.render-budget-evidence.v1";

  /**
   * Quality tier the job targeted.
   *
   * @author Samchon
   */
  tier: string;

  /**
   * Every tier the production declared, ascending.
   *
   * A job that found no budget for its own tier reads as `unbudgeted`, and this
   * is what tells a mistyped tier apart from a production that deliberately
   * declares none.
   *
   * @author Samchon
   */
  declaredTiers: string[];

  /**
   * Whether a budget was found for {@link tier}.
   *
   * @author Samchon
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
   *
   * @author Samchon
   */
  status: IAutoMovieRenderBudgetAssessment["status"];

  /**
   * One assessment per shot, ascending by shot id.
   *
   * @author Samchon
   */
  shots: IAutoMovieRenderBudgetAssessment[];

  /**
   * Digest over protocol, tier, declared tiers, aggregate status and ordered shot id/status/report-digest/target-digest tuples; full report and target values are represented only by their supplied digests.
   *
   * @author Samchon
   */
  digest: string;
}
