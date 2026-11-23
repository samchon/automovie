import type { IAutoMoviePoses } from "../geometry/IAutoMoviePoses";
import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMoviePhysicalContactBinding } from "./IAutoMoviePhysicalContactBinding";
import type { IAutoMoviePhysicalContactSupportRows } from "./IAutoMoviePhysicalContactSupportRows";
import type { IAutoMoviePhysicalPointBound } from "./IAutoMoviePhysicalPointBound";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";
import type { IAutoMoviePreparePhysicalGeometry } from "./IAutoMoviePreparePhysicalGeometry";

/**
 * One bounded articulation fit for explicit contacts, supports and optional
 * avoidance.
 */
export namespace IAutoMoviePlanPhysicalContactTargets {
  /**
   * Fit relationships in one bounded articulation solve. Actual receiver
   * surfaces, declared supports, the floor and enabled self contacts share one
   * residual vector. The root stays at its actual pose; joint limits and
   * anchors remain intact. No actual body, impulse or receipt changes.
   * Unreachable intent remains a residual, rather than becoming a claimed
   * successful contact.
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
    /**
     * Candidate-relative projection corridors, sharing the admitted
     * relationship budgets.
     */ pointBounds?: readonly IAutoMoviePhysicalPointBound[];
    /** Profile-wide collision avoidance without anatomical selectors. */ selfAvoidance?: {
      /**
       * Update budget combined by maximum with relationship budgets; solver
       * admits integer 1..64.
       */
      iterations: number;
      /**
       * Positive finite metre residual threshold combined by minimum with
       * relationship thresholds.
       */
      tolerance: number;
    };
    /** Original XYZ endpoints and optional provider-owned support patches. */ supports?: readonly IAutoMoviePhysicalContactSupportRows.ISupport[];
    /** Initialized no-dynamics convex queries. */ geometry: IAutoMoviePreparePhysicalGeometry.IQueries;
    /** World floor lower bound in metres. */ floor: number;
  };

  /**
   * Fit relationships in one bounded articulation solve. Actual receiver
   * surfaces, declared supports, the floor and enabled self contacts share one
   * residual vector. The root stays at its actual pose; joint limits and
   * anchors remain intact. No actual body, impulse or receipt changes.
   * Unreachable intent remains a residual, rather than becoming a claimed
   * successful contact.
   */
  export type IResult = {
    /**
     * Coherent fitted world motor poses with the root at its actual pose; no
     * physical teleport.
     */
    targets: Record<string, IAutoMovieRigidTransform>;
    /**
     * Metre residual norms keyed by active binding/point-bound id. Binding
     * weighting is included; self/floor rows have no entries. Empty when no
     * joints are selected.
     */
    residuals: Record<string, number>;
  };
}
