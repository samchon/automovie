import { AutoMovieContentDigest } from "@automovie/interface";
import { IAutoMovieRenderBudgetAssessment } from "./IAutoMovieRenderBudgetAssessment";


/**
 * One render job's budget evidence over every shot it draws.
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
   * `over` beats `not-run`, which beats `incomplete`, which beats `within`. A
   * job refuses on `over` and reports the other two as what they are, because
   * an unmeasured cost has not been cleared and saying otherwise is the exact
   * false capability claim this evidence exists to prevent.
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
   * Digest over the protocol, the tier, and every shot's own verdict.
   *
   * @author Samchon
   */
  digest: AutoMovieContentDigest;
}
