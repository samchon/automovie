import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";

/**
 * Bounded chain fitting of horizontal endpoint intent and real patch-plane constraints.
 *
 * @evidence contracts/development/design.md#principled-representation Optional endpoint height or surface witnesses add explicit height equalities while global patch clearance becomes a nonpenetration inequality; without either the patch minimum targets the plane.
 * @evidence contracts/development/design.md#minimal-and-owned-surface solvePhysicalFloorChainTarget consumes canonical profile transforms and provider contact carriers through the existing articulation solver.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing patch geometry, invalid carrier witnesses and invalid finite iteration/tolerance inputs refuse; solver exhaustion returns its actual residual rather than claiming contact.
 * @evidence contracts/development/common.md#meaningful-documentation Keeps horizontal endpoint intent and real floor witnesses in one bounded chain task.
 */
export namespace IAutoMovieSolvePhysicalFloorChainTarget {
  /**
   * Fit endpoint X/Z and the actual patch's lowest Y simultaneously. Independent
   * bounded native twist coordinates preserve all locked axes and rigid anchors.
   * Finite-difference Jacobians use the existing original-design SVD; damped
   * steps and backtracking accept only a measured residual decrease. Work is
   * bounded, unreachable intent remains a residual, and no body is teleported.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Keeps horizontal endpoint intent and real floor witnesses in one bounded chain task.
   * @evidence contracts/development/design.md#principled-representation World goals/floor and carrier-local witnesses are metres; endpointBone can select an interior chain endpoint and budgets limit iterations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface solvePhysicalFloorChainTarget consumes canonical profile transforms and provider contact carriers through the existing articulation solver.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A supplied endpointHeight adds a Y target while floor remains a lower bound; unreachable requests remain residuals without moving the original goal.
   */
  export type IInput = {
    /** Actual fixed-pivot tree. */ profile: IAutoMoviePhysicalProfile;
    /** Proximal-to-distal joints ending at the support endpoint. */ chain: readonly string[];
    /** Segment owners of the complete support patch. */ contacts: readonly string[];
    /** Admitted working motor goals to copy. */ targets: Readonly<
      Record<string, IAutoMovieRigidTransform>
    >;
    /** Requested world endpoint; Y is determined by the patch plane. */ goal: IAutoMovieVector3;
    /** Optional bone-local endpoint. */ localPoint?: IAutoMovieVector3;
    /** Optional endpoint inside the chain; the terminal bone remains the default. */ endpointBone?: string;
    /** Actual surface points which should share the requested plane. */ floorPoints?: readonly {
      /** Carrier bone included in contacts; an unlisted carrier is refused. */
      bone: string;
      /** Finite carrier-local point in metres; the transformed world Y should equal floor. */
      localPoint: IAutoMovieVector3;
    }[];
    /** Fit endpoint Y and treat the floor as a lower bound when supplied. */ endpointHeight?: number;
    /** Requested minimum patch height, metres. */ floor: number;
    /** Positive update budget, at most 64. */ iterations: number;
    /** Positive metre residual early-out. */ tolerance: number;
  };
}
