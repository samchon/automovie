import type { IAutoMoviePoses } from "../geometry/IAutoMoviePoses";
import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMoviePhysicalContactBinding } from "./IAutoMoviePhysicalContactBinding";
import type { IAutoMoviePhysicalContactSupportRows } from "./IAutoMoviePhysicalContactSupportRows";
import type { IAutoMoviePhysicalPointBound } from "./IAutoMoviePhysicalPointBound";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";
import type { IAutoMoviePreparePhysicalGeometry } from "./IAutoMoviePreparePhysicalGeometry";

/**
 * One bounded articulation fit for explicit contacts, supports and optional avoidance.
 *
 * @evidence contracts/development/design.md#principled-representation Actual receiver geometry, original supports and floor/avoidance rows contribute to one measured residual vector while the source root is rebased to its actual pose.
 * @evidence contracts/development/design.md#minimal-and-owned-surface planPhysicalContactTargets composes existing geometry queries and articulation rows rather than adding native dynamics to the input. planPhysicalContactTargets allocates target and residual records for the tracking caller; ids retain the original relationships.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Bounded fitting preserves unmet intent rather than generating a contact receipt; self/floor constraints have no per-binding result row and an empty residual map alone is not proof of success.
 * @evidence contracts/development/common.md#meaningful-documentation Explains simultaneous actual receivers, original support promises and shared residual budgets. Identifies coherent motor poses and binding-attributed residuals after a bounded fit.
 */
export namespace IAutoMoviePlanPhysicalContactTargets {
  /**
   * Fit relationships in one bounded articulation solve. Actual receiver surfaces,
   * declared supports, the floor and enabled self contacts share one residual
   * vector. The root stays at its actual pose; joint limits and anchors remain
   * intact. No actual body, impulse or receipt changes. Unreachable intent remains
   * a residual, rather than becoming a claimed successful contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Explains simultaneous actual receivers, original support promises and shared residual budgets.
   * @evidence contracts/development/design.md#principled-representation Canonical bindings and point bounds select relationship tasks over world poses; floor and residual tolerance are metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface planPhysicalContactTargets composes existing geometry queries and articulation rows rather than adding native dynamics to the input.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional avoidance/supports add only declared tasks; unreachable relationships remain residuals without changing receipts or actual poses.
   */
  export type IInput = {
    /** Source scene identity. */ body: string;
    /** Exact source and receiver profiles. */ profiles: Readonly<
      Record<string, IAutoMoviePhysicalProfile>
    >;
    /** Authored motor placements, borrowed without mutation. */ targets: IAutoMoviePoses;
    /** One simultaneous actual scene snapshot. */ actual: Readonly<
      Record<string, IAutoMoviePoses>
    >;
    /** Explicit relationships for this cached interval. */ bindings: readonly IAutoMoviePhysicalContactBinding[];
    /** Candidate-relative projection corridors, sharing the admitted relationship budgets. */ pointBounds?: readonly IAutoMoviePhysicalPointBound[];
    /** Profile-wide collision avoidance without anatomical selectors. */ selfAvoidance?: {
      /** Update budget combined by maximum with relationship budgets; solver admits integer 1..64. */
      iterations: number;
      /** Positive finite metre residual threshold combined by minimum with relationship thresholds. */
      tolerance: number;
    };
    /** Original XYZ endpoints and optional provider-owned support patches. */ supports?: readonly IAutoMoviePhysicalContactSupportRows.ISupport[];
    /** Initialized no-dynamics convex queries. */ geometry: IAutoMoviePreparePhysicalGeometry.IQueries;
    /** World floor lower bound in metres. */ floor: number;
  };

  /**
   * Fit relationships in one bounded articulation solve. Actual receiver surfaces,
   * declared supports, the floor and enabled self contacts share one residual
   * vector. The root stays at its actual pose; joint limits and anchors remain
   * intact. No actual body, impulse or receipt changes. Unreachable intent remains
   * a residual, rather than becoming a claimed successful contact.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies coherent motor poses and binding-attributed residuals after a bounded fit.
   * @evidence contracts/development/design.md#principled-representation World-metre/unit-quaternion transforms retain the actual root; residual norms use metres with binding weights included.
   * @evidence contracts/development/design.md#minimal-and-owned-surface planPhysicalContactTargets allocates target and residual records for the tracking caller; ids retain the original relationships.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Floor/self rows are not entries in the residual map, and an empty map with no selected joints is not proof every relationship succeeded.
   */
  export type IResult = {
    /** Coherent fitted world motor poses with the root at its actual pose; no physical teleport. */
    targets: Record<string, IAutoMovieRigidTransform>;
    /**
     * Metre residual norms keyed by active binding/point-bound id. Binding weighting
     * is included; self/floor rows have no entries. Empty when no joints are selected.
     */
    residuals: Record<string, number>;
  };
}
