import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";

/**
 * A whole-body fit and its residual report. Fit a whole articulated body to one
 * endpoint goal while a support segment stays held, turning only about its
 * contact.
 */
export namespace IAutoMovieFitPhysicalWholeBodyTarget {
  /** A whole-body fit and its residual report. */
  export interface IResult {
    /** World pose of every original segment. */
    targets: Record<string, IAutoMovieRigidTransform>;

    /** Total residual norm, metres. */
    residual: number;

    /** Endpoint point error, metres. */
    position: number;

    /** Weighted approach direction error, metres; zero without an approach. */
    approach: number;
  }

  /**
   * Fit a whole articulated body to one endpoint goal while a support segment
   * stays held, turning only about its contact.
   *
   * The tree is held from the support ({@link rerootPhysicalProfile}), and a
   * virtual base hinges onto it at the contact point about the contact normal
   * within the declared turn, so the old root (a pelvis) rotates, tilts and
   * translates through the support chain's own joints while the reaching chain
   * reaches. Every coordinate stays inside its own declared ROM, the contact
   * point never moves, and the bounded articulation solver
   * ({@link solvePhysicalArticulationTargets}) accepts only residual decreases.
   * The residual is the goal point's world error in metres and, when an
   * approach is declared, the weighted difference between the endpoint's local
   * direction carried to world and the approach direction.
   */
  export type IInput = {
    /** Admitted fixed-pivot tree. */ profile: IAutoMoviePhysicalProfile;
    /** Current world pose of every segment. */ targets: Readonly<
      Record<string, IAutoMovieRigidTransform>
    >;
    /** The held support and its bounded turn about the contact normal. */ support: {
      /** Held segment. */ bone: string;
      /** World contact point, metres. */ point: IAutoMovieVector3;
      /** Unit world contact normal the support may turn about. */ normal: IAutoMovieVector3;
      /** Lower turn, radians. */ minimum: number;
      /** Upper turn, radians. */ maximum: number;
    };
    /**
     * Segments whose joint toward the old root may move: the support chain, the
     * trunk and the reaching chain.
     */ bones: readonly string[];
    /** The endpoint goal. */ goal: {
      /** Segment carrying the endpoint. */ bone: string;
      /** Endpoint in that segment's frame, metres. */ localPoint: IAutoMovieVector3;
      /** World goal point, metres. */ point: IAutoMovieVector3;
      /**
       * Optional arrival direction: the segment's local direction should point
       * along it.
       */ approach?: {
        /** Unit direction in the segment's frame. */ localDirection: IAutoMovieVector3;
        /** Unit world direction. */ direction: IAutoMovieVector3;
        /** Metres of residual per unit of direction difference; positive. */ weight: number;
      };
    };
    /** Positive update budget, at most 64. */ iterations: number;
    /** Positive residual early-out, metres. */ tolerance: number;
  };
}
