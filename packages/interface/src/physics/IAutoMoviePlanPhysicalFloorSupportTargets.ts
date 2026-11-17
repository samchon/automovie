import type { IAutoMovieRigidTransform } from "../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieFootfallPattern } from "./IAutoMovieFootfallPattern";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";

/**
 * Bounded multi-pass fitting of real support patches and original horizontal intent.
 *
 * @evidence contracts/development/design.md#principled-representation Planted patches use the floor while unplanted patches preserve their requested clearance; endpoint-height constraints and actual shape minima remain separate observations.
 * @evidence contracts/development/design.md#minimal-and-owned-surface planPhysicalFloorSupportTargets shares the physical chain solver and consumes provider-owned contact geometry. The floor-support planner returns new maps for later motor tracking and diagnostic inspection.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Invalid pass limits, unknown planted endpoints and missing/empty geometry patches refuse; bounded passes can finish with residuals and never change native bodies.
 * @evidence contracts/development/common.md#meaningful-documentation Defines original horizontal goals, planted patches, explicit endpoint heights and one shared lowering budget. Separates fitted motor poses, requested goals, residual norms, signed floor errors and accumulated root drop.
 */
export namespace IAutoMoviePlanPhysicalFloorSupportTargets {
  /**
   * Fit declared support patches to a plane using their actual convex geometry.
   * Keep authored horizontal goals and solve the actual patch height together
   * with those goals, retaining unreachable endpoint/floor residuals.
   * A shared root-drop budget is consumed across passes; cached bodies are never
   * corrected. Non-planted patches preserve their authored clearance, clamped
   * to the floor, so a root-drop correction cannot drive a swinging sole below it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines original horizontal goals, planted patches, explicit endpoint heights and one shared lowering budget.
   * @evidence contracts/development/design.md#principled-representation World-metre endpoints and floors combine with canonical profile/pattern topology; bounded pass and iteration counts constrain work.
   * @evidence contracts/development/design.md#minimal-and-owned-surface planPhysicalFloorSupportTargets shares the physical chain solver and consumes provider-owned contact geometry.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Nonplanted patches retain authored clearance; endpointHeights opt into explicit Y promises instead of replacing X/Z intent.
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
    /** Explicit world endpoint heights retained alongside floor nonpenetration. Omission preserves the plane-fitting contract. */ endpointHeights?: Readonly<
      Record<string, number>
    >;
    /** World plane height, metres. */ floor: number;
    /** Total permitted root lowering across all passes, metres. */ maximumRootDrop: number;
    /** Bounded outer orientation/height passes, 1..16. */ passes: number;
    /** Per-chain IK iterations, 1..64. */ iterations: number;
    /** Metre endpoint and floor early-out threshold. */ tolerance: number;
  };

  /**
   * Fit declared support patches to a plane using their actual convex geometry.
   * Keep authored horizontal goals and solve the actual patch height together
   * with those goals, retaining unreachable endpoint/floor residuals.
   * A shared root-drop budget is consumed across passes; cached bodies are never
   * corrected. Non-planted patches preserve their authored clearance, clamped
   * to the floor, so a root-drop correction cannot drive a swinging sole below it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Separates fitted motor poses, requested goals, residual norms, signed floor errors and accumulated root drop.
   * @evidence contracts/development/design.md#principled-representation All positions and errors are metres; a negative floor error denotes penetration and rootDrop is nonnegative downward travel.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The floor-support planner returns new maps for later motor tracking and diagnostic inspection.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Updated goal Y remains a request rather than achieved pose; infeasible endpoints and floor constraints retain their measured errors.
   */
  export type IResult = {
    /** New fitted world motor poses after the final bounded pass. */
    targets: Record<string, IAutoMovieRigidTransform>;
    /**
     * Owned endpoint goals in world metres. Original X/Z are retained; Y is the
     * explicit endpoint height or an updated plane-fitting request, not achieved pose.
     */
    goals: Record<string, IAutoMovieVector3>;
    /** Final chain residual norms in metres, keyed by endpoint bone; infeasible requests remain. */
    residuals: Record<string, number>;
    /** Signed patch-minimum minus assigned plane height in metres; negative means penetration. */
    floorErrors: Record<string, number>;
    /** Accumulated nonnegative lowering in metres, consuming one shared budget across passes. */
    rootDrop: number;
  };
}
