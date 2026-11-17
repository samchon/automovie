import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieFootfallPattern } from "./IAutoMovieFootfallPattern";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";

/**
 * Bounded support-chain fitting with a reach-derived root lowering request.
 *
 * @evidence contracts/development/design.md#principled-representation Lower copied world poses by the shared reach estimate, then fit each declared chain toward the original or explicitly replaced endpoint.
 * @evidence contracts/development/design.md#minimal-and-owned-surface planPhysicalSupportTargets coordinates reach and chain fitting for the existing support controller. The support planner supplies these new motor-target records to tracking while leaving native body state unchanged.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Original goals remain fixed and bounded fits can return unmet residuals; the returned motor targets never teleport simulated bodies.
 * @evidence contracts/development/common.md#meaningful-documentation Specifies changed support goals, reach-derived lowering and bounded chain-fitting policy. Defines fitted motor poses, bounded lowering intent and remaining endpoint error.
 */
export namespace IAutoMoviePlanPhysicalSupportTargets {
  /**
   * Feed a changed support placement back to bounded joint goals. Root lowering
   * follows the actual chain reach sphere and an explicit posture budget; it
   * never teleports a body or moves the requested support to hide a residual.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Specifies changed support goals, reach-derived lowering and bounded chain-fitting policy.
   * @evidence contracts/development/design.md#principled-representation World-metre transforms and endpoint goals use canonical profile/pattern topology; maximumRootDrop and tolerance are metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface planPhysicalSupportTargets coordinates reach and chain fitting for the existing support controller.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The original endpoint request remains authoritative even when unreachable; iterations bound work rather than certify contact.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines fitted motor poses, bounded lowering intent and remaining endpoint error.
   * @evidence contracts/development/design.md#principled-representation targets are world rigid transforms, rootDrop is nonnegative metres and residuals are metre norms keyed by endpoint bone.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The support planner supplies these new motor-target records to tracking while leaving native body state unchanged.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Residuals can exceed tolerance at budget exhaustion; requesting a root drop does not teleport the body or establish support.
   */
  export type IResult = {
    /** New fitted world motor poses; no native body or original pose record is moved. */
    targets: Record<string, IAutoMovieRigidTransform>;
    /** Nonnegative reach-derived root lowering request in metres, within the supplied budget. */
    rootDrop: number;
    /** Endpoint-bone metre residuals from bounded chain fitting; nonzero may remain at budget exhaustion. */
    residuals: Record<string, number>;
  };
}
