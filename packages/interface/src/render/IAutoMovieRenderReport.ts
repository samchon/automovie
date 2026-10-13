import { AutoMovieContentDigest } from "../production/AutoMovieContentDigest";
import { IAutoMovieRenderFinding } from "./IAutoMovieRenderFinding";
import { IAutoMovieRenderTarget } from "./IAutoMovieRenderTarget";

/**
 * A bounded verdict: every budgeted render cost, what it measured, and who pays
 * for it.
 *
 * The report is deliberately O(1) in the size of the production. It carries one
 * finding per metric and at most
 * {@link AUTOMOVIE_RENDER_REPORT_MAX_CONTRIBUTORS} dominant owners per finding,
 * with the remainder counted rather than listed. A report that grew with the
 * scene would be the thing nobody reads on the artifact that most needs
 * reading, and truncating silently would make it a lie, so the omitted owners
 * and their omitted cost are both stated.
 *
 * A finding never reports a missing analysis as a pass. `unsupported` and
 * `not-run` are first-class outcomes that make the whole report `incomplete`,
 * because "we did not look" and "we looked and it was fine" are different facts
 * and only one of them clears an artifact.
 *
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
   * Worst outcome across findings: `over` when any budgeted metric exceeds its
   * limit, otherwise `incomplete` when any metric is `unsupported` or
   * `not-run`, otherwise `within`.
   *
   * `within` means exactly "nothing measured exceeded a declared limit and no
   * analysis is missing". It does NOT mean the production is budgeted: a legacy
   * production that declares no budget reports `within` with every finding
   * `unbudgeted` and the tier spelled `unbudgeted`, which is the documented
   * default and is deliberately distinguishable from a production that declared
   * limits and met them.
   */
  status: "within" | "over" | "incomplete";

  /**
   * One finding per metric, in the fixed metric order.
   *
   * Fixed length, so the report's size never depends on how large the
   * production is.
   */
  findings: IAutoMovieRenderFinding[];

  /** Digest of the semantic mask this report is evidence beside. */
  mask: AutoMovieContentDigest;

  /** Renderer, settings and assets the measurement is bound to. */
  target: IAutoMovieRenderTarget;

  /**
   * Digest over the protocol, tier, findings, mask digest and target digest.
   */
  digest: AutoMovieContentDigest;
}
