import type { IAutoMovieCollisionResponse } from "../physics/IAutoMovieCollisionResponse";

/**
 * The fields every advice state carries.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The fields every advice state carries. Member documentation states the supplied records, units and absence meanings used by IAutoMovieShotPhysicsAdvice and validateShotPhysicsAdvice.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The base does not invent alternative state flags or duplicate response mechanics; shot-level admission owns nonblank unique advice ids.
 * @evidence contracts/development/design.md#principled-representation id identifies one supplier-authored advice item and proposal reuses the canonical collision response for impact, recoil and any ROM-bounded flinch.
 * @evidence contracts/development/design.md#minimal-and-owned-surface interface owns IAutoMovieShotPhysicsAdviceBase, used by IAutoMovieShotPhysicsAdvice and validateShotPhysicsAdvice. Its id, proposal members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
 */
export interface IAutoMovieShotPhysicsAdviceBase {
  /** Advice id chosen by the supplier; non-blank and unique within the shot. */
  id: string;

  /**
   * The engine-computed collision response: impact, recoil push and, when a
   * struck chain was given, the ROM-bounded flinch pose.
   */
  proposal: IAutoMovieCollisionResponse;
}
