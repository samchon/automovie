import type { IAutoMovieRigidTransform } from "../../geometry/IAutoMovieRigidTransform";
import type { IAutoMoviePhysicalProfile } from "../../physics/IAutoMoviePhysicalProfile";

/**
 * Transfer a supported authored Human pose to native motor coordinates.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Declares the pose and solver units and the distinction between a fit and a refusal.
 * @evidence contracts/development/design.md#principled-representation Uses an unchanged canonical profile, complete world poses, a horizontal support plane and a discriminated fit result.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Human owns the identified sole regions. Engine owns the joint solve. The consumer owns whether to start a simulation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A failed transfer exposes its failure reason and no runnable target.
 */
export namespace IAutoMovieFitHumanPhysicalStandingPose {
  /**
   * One articulated standing pose already touching a horizontal ground plane.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the provider and world/metre premises and the bounded solve settings.
   * @evidence contracts/development/design.md#principled-representation Each declared provider segment has one actual authored world transform.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps the original profile and world transforms as the sole pose inputs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Accuracy and iteration budget are explicit and the authored ground plane is not inferred from a moved pose.
   */
  export interface IInput {
    /** Canonical Human profile supplying the actual foot and toe colliders. */
    profile: IAutoMoviePhysicalProfile;

    /** Complete authored rigid segment transforms in world metres. */
    targets: Readonly<Record<string, IAutoMovieRigidTransform>>;

    /** Source ground elevation in world metres. */
    floor: number;

    /** Positive metre bound for the fit residual and standing contact. */
    tolerance: number;

    /** Positive articulation budget, at most 64 updates. */
    iterations: number;
  }

  /**
   * A fitted native target or the reason the transfer could not be accepted.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines outcome indicators, residual units and when a residual exists.
   * @evidence contracts/development/design.md#principled-representation Only the fitted case supplies a complete native pose. A refusal may retain an unresolved geometric residual.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The result carries just the native goals, measured residual or cause of refusal.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A missed fit cannot be consumed as a native standing target.
   */
  export type IResult =
    | {
        /** The foot geometry and whole-body native constraints were verified. */
        kind: "fitted";

        /** Owned native motor goals for every segment, world metres. */
        targets: Record<string, IAutoMovieRigidTransform>;

        /** Geometric fit residual in metres. */
        residual: number;
      }
    | {
        /** A source or fit failed an admission condition. */
        kind: "unresolved";

        /** The condition that refused the transfer. */
        reason:
          | "input"
          | "support-geometry"
          | "support-plane"
          | "anchor"
          | "fit"
          | "joint-limit"
          | "balance";

        /** Geometric residual in metres when fitting had already started. */
        residual?: number;
      };
}
