import type { IAutoMovieRigidTransform } from "../../geometry/IAutoMovieRigidTransform";
import type { IAutoMoviePhysicalProfile } from "../../physics/IAutoMoviePhysicalProfile";

/** Transfer a supported authored Human pose to native motor coordinates. */
export namespace IAutoMovieFitHumanPhysicalStandingPose {
  /**
   * One articulated standing pose whose soles bear on a horizontal ground plane
   * as the motion foot model reads them; the transfer plants the collider soles
   * on it and opens an arm resting on the body clear of the rigid colliders.
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

  /** A fitted native target or the reason the transfer could not be accepted. */
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
