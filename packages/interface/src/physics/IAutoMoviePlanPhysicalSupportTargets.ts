import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieFootfallPattern } from "./IAutoMovieFootfallPattern";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";

/** Bounded support-chain fitting with a reach-derived root lowering request. */
export namespace IAutoMoviePlanPhysicalSupportTargets {
  /**
   * Feed a changed support placement back to bounded joint goals. Root lowering
   * follows the actual chain reach sphere and an explicit posture budget; it
   * never teleports a body or moves the requested support to hide a residual.
   */
  export type IInput = {
    /** Actual generic profile. */ profile: IAutoMoviePhysicalProfile;
    /** Same support paths as the authored planner. */ pattern: IAutoMovieFootfallPattern;
    /** Authored world goals. */ targets: Readonly<
      Record<string, IAutoMovieRigidTransform>
    >;
    /** Changed endpoint goals, in world metres. */ goals: Readonly<
      Record<string, IAutoMovieVector3>
    >;
    /** Maximum allowed root lowering, metres. */ maximumRootDrop: number;
    /** Per-chain coordinate-descent budget. */ iterations: number;
    /** Metre early-out residual. */ tolerance: number;
  };

  /**
   * Feed a changed support placement back to bounded joint goals. Root lowering
   * follows the actual chain reach sphere and an explicit posture budget; it
   * never teleports a body or moves the requested support to hide a residual.
   */
  export type IResult = {
    /**
     * New fitted world motor poses; no native body or original pose record is
     * moved.
     */
    targets: Record<string, IAutoMovieRigidTransform>;
    /**
     * Nonnegative reach-derived root lowering request in metres, within the
     * supplied budget.
     */
    rootDrop: number;
    /**
     * Endpoint-bone metre residuals from bounded chain fitting; nonzero may
     * remain at budget exhaustion.
     */
    residuals: Record<string, number>;
  };
}
