import type { IAutoMovieFootfallPattern } from "./IAutoMovieFootfallPattern";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * Bounded support-chain fitting with a reach-derived root lowering request.
 *
 * @evidence contracts/development/design.md#principled-representation Lower copied world poses by the shared reach estimate, then fit each declared chain toward the original or explicitly replaced endpoint.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One common result carries fitted poses, requested lowering and endpoint residuals for both ordinary and balance-aware support planners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Original goals remain fixed and bounded fits can return unmet residuals; the returned motor targets never teleport simulated bodies.
 * @evidence contracts/development/common.md#meaningful-documentation Members state world metre goals, positive-down lowering, iteration limits, tolerance and new result ownership.
 */
export namespace IAutoMoviePlanPhysicalSupportTargets {
  /**
   * Feed a changed support placement back to bounded joint goals. Root lowering
   * follows the actual chain reach sphere and an explicit posture budget; it
   * never teleports a body or moves the requested support to hide a residual.
   */
  export type IInput = {
    /** Actual generic profile. */ profile: IAutoMoviePhysicalProfile;
    /** Same support paths as the authored planner. */ pattern: IAutoMovieFootfallPattern;
    /** Authored world goals. */ targets: Readonly<Record<string, IAutoMoviePhysicalProfile.ITransform>>;
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
    /** New fitted world motor poses; no native body or original pose record is moved. */
    targets: Record<string, IAutoMoviePhysicalProfile.ITransform>;
    /** Nonnegative reach-derived root lowering request in metres, within the supplied budget. */
    rootDrop: number;
    /** Endpoint-bone metre residuals from bounded chain fitting; nonzero may remain at budget exhaustion. */
    residuals: Record<string, number>;
  };
}
