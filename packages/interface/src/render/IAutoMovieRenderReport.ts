import { IAutoMovieRenderFinding } from "./IAutoMovieRenderFinding";
import { IAutoMovieRenderTarget } from "./IAutoMovieRenderTarget";

/**
 * A bounded verdict: every budgeted render cost, what it measured, and who pays for it.
 *
 * Each fixed metric carries at most the caller-selected positive safe integer K dominant owners, defaulting to the engine's contributor limit, with omitted owners and cost counted. Fixed K bounds the finding population; the complete report still retains its borrowed target asset inventory and variable-length source and recovery strings.
 *
 * Unsupported or not-run analysis prevents aggregate within. A measured budget breach takes over precedence; otherwise an analysis gap makes the report incomplete. Missing measurement never becomes a successful numeric finding.
 *
 * @evidence contracts/common.md#principled-implementation Budget evaluation emits one finding per fixed metric, reduces aggregate state by over then incomplete precedence and hashes fixed-position JSON tuples covering every finding field, including contributor sources and recovery, plus mask and target identity.
 * @evidence contracts/common.md#clear-and-simple-design Fixed metrics and caller-selected top-K attribution bound new finding records while omitted counts and costs preserve remaining attribution; borrowed target assets and string bytes still determine full retained or serialized report size.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Aggregate within with all unbudgeted findings is explicitly no agreed budget, not universal clearance; unsupported and not-run cannot become measured success and stale target identity invalidates reuse.
 * @evidence contracts/common.md#meaningful-documentation Defines state precedence, unbudgeted aggregate meaning, fixed metric order, bounded attribution and mask/target/digest binding.
 * @author Samchon
 */
export interface IAutoMovieRenderReport {
  /** Report format. */
  version: 1;

  /** Versioned report protocol. */
  protocol: "automovie.render-report.v1";

  /** Quality tier the budget declared. */
  tier: string;

  /**
   * Worst outcome across findings: `over` when any budgeted metric exceeds its limit, otherwise `incomplete` when any metric is `unsupported` or `not-run`, otherwise `within`.
   *
   * `within` means exactly "nothing measured exceeded a declared limit and no analysis is missing". It does not mean the production is budgeted: a legacy production that declares no budget reports `within` with every finding `unbudgeted` and the tier spelled `unbudgeted`, distinguishable from a production that declared limits and met them.
   */
  status: "within" | "over" | "incomplete";

  /**
   * One finding per metric, in the fixed metric order.
   *
   * The metric count is fixed; contributor arrays follow the caller's K bound and strings retain their actual byte lengths.
   */
  findings: IAutoMovieRenderFinding[];

  /** Digest of the semantic mask this report is evidence beside. */
  mask: string;

  /** Renderer, settings and assets the measurement is bound to. */
  target: IAutoMovieRenderTarget;

  /**
   * Digest over the protocol, tier, findings, mask digest and target digest.
   */
  digest: string;
}
