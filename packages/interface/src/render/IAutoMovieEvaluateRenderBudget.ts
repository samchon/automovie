import type { IAutoMovieRenderBudget } from "./IAutoMovieRenderBudget";
import type { IAutoMovieRenderInventory } from "./IAutoMovieRenderInventory";
import type { IAutoMovieRenderTarget } from "./IAutoMovieRenderTarget";
import type { IAutoMovieSemanticMask } from "./IAutoMovieSemanticMask";

/** Data and callback contracts shared by the EvaluateRenderBudget operations. */
export namespace IAutoMovieEvaluateRenderBudget {
  /**
   * Check one inventory against one declared budget and produce the bounded
   * report.
   *
   * The report answers for every metric, always, with one of five outcomes.
   * Four of them are not "pass":
   *
   * - `within`: measured, budgeted, at or below the limit;
   * - `over`: measured, budgeted, above the limit, with the dominant owners and
   *   the exact way back;
   * - `unbudgeted`: measured, but the production declared no limit, so nobody
   *   agreed what large means;
   * - `unsupported`: no analysis exists for what the design declares;
   * - `not-run`: the analysis exists but its input was not supplied.
   *
   * The last two make the whole report `incomplete`. That is the point of them:
   * an artifact whose fluid cost was never computed has not been cleared for
   * fluid cost, and a report that said `within` would be the exact false
   * capability claim this evidence exists to prevent.
   *
   * A budget limit that is negative, fractional or non-finite is an authoring
   * mistake and throws, rather than becoming a budget that can never be met.
   *
   * An `over` finding names somewhere the author can actually go. The limit is
   * compared against the inventory's own total, frame passes and all, but the
   * dominant-owner ranking is over the owners that hold their own cost; the
   * passes are counted among the owners the report does not name and stated in
   * the recovery as passes. A ranking that let them compete would put the same
   * name first in every production that lights nothing, and that name is a
   * guide pass no production declares.
   */
  export type IProps = {
    /** Measured cost of the artifact. */
    inventory: IAutoMovieRenderInventory;
    /** Declared limits, or `null` for a production that declares none. */
    budget: IAutoMovieRenderBudget | null;
    /** Semantic palette the owners in this report are addressable in. */
    mask: IAutoMovieSemanticMask;
    /** Renderer, settings and assets the measurement is bound to. */
    target: IAutoMovieRenderTarget;
    /** Dominant-owner bound; defaults to the exported maximum. */
    maxContributors?: number;
  };
}
