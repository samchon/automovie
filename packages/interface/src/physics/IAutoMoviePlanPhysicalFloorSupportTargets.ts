import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieFootfallPattern } from "./IAutoMovieFootfallPattern";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";

/**
 * Bounded multi-pass fitting of real support patches and original horizontal
 * intent.
 */
export namespace IAutoMoviePlanPhysicalFloorSupportTargets {
  /**
   * Fit declared support patches to a plane using their actual convex geometry.
   * Keep authored horizontal goals and solve the actual patch height together
   * with those goals, retaining unreachable endpoint/floor residuals. A shared
   * root-drop budget is consumed across passes; cached bodies are never
   * corrected. Non-planted patches preserve their authored clearance, clamped
   * to the floor, so a root-drop correction cannot drive a swinging sole below
   * it.
   */
  export type IInput = {
    /** Admitted fixed-pivot profile. */ profile: IAutoMoviePhysicalProfile;
    /** Arbitrary support chains and patch owners. */ pattern: IAutoMovieFootfallPattern;
    /** Already admitted native motor placements. */ targets: Readonly<
      Record<string, IAutoMovieRigidTransform>
    >;
    /** Authored endpoint goals, in world metres. */ goals: Readonly<
      Record<string, IAutoMovieVector3>
    >;
    /** Endpoints whose declared patches must touch the plane. */ planted: readonly string[];
    /**
     * Explicit world endpoint heights retained alongside floor nonpenetration.
     * Omission preserves the plane-fitting contract.
     */ endpointHeights?: Readonly<Record<string, number>>;
    /** World plane height, metres. */ floor: number;
    /** Total permitted root lowering across all passes, metres. */ maximumRootDrop: number;
    /** Bounded outer orientation/height passes, 1..16. */ passes: number;
    /** Per-chain IK iterations, 1..64. */ iterations: number;
    /** Metre endpoint and floor early-out threshold. */ tolerance: number;
  };

  /**
   * Fit declared support patches to a plane using their actual convex geometry.
   * Keep authored horizontal goals and solve the actual patch height together
   * with those goals, retaining unreachable endpoint/floor residuals. A shared
   * root-drop budget is consumed across passes; cached bodies are never
   * corrected. Non-planted patches preserve their authored clearance, clamped
   * to the floor, so a root-drop correction cannot drive a swinging sole below
   * it.
   */
  export type IResult = {
    /** New fitted world motor poses after the final bounded pass. */
    targets: Record<string, IAutoMovieRigidTransform>;
    /**
     * Owned endpoint goals in world metres. Original X/Z are retained; Y is the
     * explicit endpoint height or an updated plane-fitting request, not
     * achieved pose.
     */
    goals: Record<string, IAutoMovieVector3>;
    /**
     * Final chain residual norms in metres, keyed by endpoint bone; infeasible
     * requests remain.
     */
    residuals: Record<string, number>;
    /**
     * Signed patch-minimum minus assigned plane height in metres; negative
     * means penetration.
     */
    floorErrors: Record<string, number>;
    /**
     * Accumulated nonnegative lowering in metres, consuming one shared budget
     * across passes.
     */
    rootDrop: number;
  };
}
