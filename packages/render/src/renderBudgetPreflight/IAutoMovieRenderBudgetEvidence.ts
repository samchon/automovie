import { AutoMovieContentDigest } from "@automovie/interface";
import { IAutoMovieRenderBudgetAssessment } from "./IAutoMovieRenderBudgetAssessment";


/**
 * One render job's budget evidence over every shot it draws.
 *
 * @evidence requirements/rendering/budgets.md#rendering-budget-decision `IAutoMovieRenderBudgetEvidence` carries the conservative measurement basis and deterministic budget decision.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight `IAutoMovieRenderBudgetEvidence` exposes that responsibility through the package-independent system contract.
 * @author Samchon
 */
export interface IAutoMovieRenderBudgetEvidence {
  /**
   * Evidence format.
   *
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision `IAutoMovieRenderBudgetEvidence.version` carries the conservative measurement basis and deterministic budget decision.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight `IAutoMovieRenderBudgetEvidence.version` exposes that responsibility through the package-independent system contract.
   * @author Samchon
   */
  version: 1;

  /**
   * Versioned evidence protocol.
   *
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision `IAutoMovieRenderBudgetEvidence.protocol` carries the conservative measurement basis and deterministic budget decision.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight `IAutoMovieRenderBudgetEvidence.protocol` exposes that responsibility through the package-independent system contract.
   * @author Samchon
   */
  protocol: "automovie.render-budget-evidence.v1";

  /**
   * Quality tier the job targeted.
   *
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision `IAutoMovieRenderBudgetEvidence.tier` carries the conservative measurement basis and deterministic budget decision.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight `IAutoMovieRenderBudgetEvidence.tier` exposes that responsibility through the package-independent system contract.
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
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision `IAutoMovieRenderBudgetEvidence.declaredTiers` carries the conservative measurement basis and deterministic budget decision.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight `IAutoMovieRenderBudgetEvidence.declaredTiers` exposes that responsibility through the package-independent system contract.
   * @author Samchon
   */
  declaredTiers: string[];

  /**
   * Whether a budget was found for {@link tier}.
   *
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision `IAutoMovieRenderBudgetEvidence.budgeted` carries the conservative measurement basis and deterministic budget decision.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight `IAutoMovieRenderBudgetEvidence.budgeted` exposes that responsibility through the package-independent system contract.
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
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision `IAutoMovieRenderBudgetEvidence.status` carries the conservative measurement basis and deterministic budget decision.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight `IAutoMovieRenderBudgetEvidence.status` exposes that responsibility through the package-independent system contract.
   * @author Samchon
   */
  status: IAutoMovieRenderBudgetAssessment["status"];

  /**
   * One assessment per shot, ascending by shot id.
   *
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision `IAutoMovieRenderBudgetEvidence.shots` carries the conservative measurement basis and deterministic budget decision.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight `IAutoMovieRenderBudgetEvidence.shots` exposes that responsibility through the package-independent system contract.
   * @author Samchon
   */
  shots: IAutoMovieRenderBudgetAssessment[];

  /**
   * Digest over the protocol, the tier, and every shot's own verdict.
   *
   * @evidence requirements/rendering/budgets.md#rendering-budget-decision `IAutoMovieRenderBudgetEvidence.digest` carries the conservative measurement basis and deterministic budget decision.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight `IAutoMovieRenderBudgetEvidence.digest` exposes that responsibility through the package-independent system contract.
   * @author Samchon
   */
  digest: AutoMovieContentDigest;
}
