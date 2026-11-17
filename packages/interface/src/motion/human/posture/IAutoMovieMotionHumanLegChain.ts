import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieSwivelSeed } from "../../../pose/IAutoMovieSwivelSeed";

/**
 * A leg posed as the posture's own fit poses it, read through the engine's
 * hinged chain (`hingedArmSwivel`): the knee bends about its hinge alone,
 * and the leg is one bend branch and one swivel about its hip-to-ankle line.
 * `fit` runs the posture's leg fit itself (`HumanLimbFit.remembered`,
 * remembered by its exact inputs) on a pelvis and reads its branch and swivel,
 * and `seeded` does so continuing a nearby fit's seed;
 * `pose` places the leg from a held branch and swivel for any ankle, so a
 * planner that holds them between fits poses the very knee the fit does
 * wherever its swivel is the fit's; `read` takes them from shown bones.
 *
 * @evidence contracts/development/common.md#meaningful-documentation hip: The hip joint, world metres. knee: The knee, world metres. ankle: The ankle, world metres.
 * @evidence contracts/development/design.md#principled-representation hip: The hip joint, world metres. knee: The knee, world metres. ankle: The ankle, world metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanLegChain.ts (HumanLegChain.pose, held); posture/HumanLegChain.ts (HumanLegChain.read, return); posture/HumanLegChain.ts (HumanLegChain.fit, return); reaction/staggerSequential.ts (staggerSequential.solve.piecesOf.swivels.slope.read, return); posture/HumanLegChain.ts (HumanLegChain.pose, return); posture/HumanLegChain.ts (HumanLegChain.seeded, return).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion, IAutoMovieSwivelSeed identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanLegChain {
  /**
   * A leg as posed, world frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame.
   * @evidence contracts/development/design.md#principled-representation The joints and the two bones' world rotations.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPosed {
    /** The hip joint, world metres. */
    hip: IAutoMovieVector3;

    /** The knee, world metres. */
    knee: IAutoMovieVector3;

    /** The ankle, world metres. */
    ankle: IAutoMovieVector3;

    /** The thigh's world rotation. */
    thigh: IAutoMovieQuaternion;

    /** The shank's world rotation. */
    shank: IAutoMovieQuaternion;
  }

  /**
   * A leg's bend branch and swivel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit.
   * @evidence contracts/development/design.md#principled-representation The engine's branch order and swivel.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ISwivel {
    /** The bend branch, its index in `hingedArmSwivel.branches`. */
    branch: number;

    /** The swivel about the hip-to-ankle line, degrees. */
    swivel: number;
  }

  /**
   * The posture's own leg fit, as `fit`, with the seed that continues it and, given `near`, continuing a nearby fit of the same leg (`HumanLimbFit.remembered`'s `near`): every pass refines that seed instead of sweeping the swivel, so a fit of inputs a small step from a fitted leg's costs a refinement, not a sweep. Result returned by HumanLegChain.seeded. The fit's branch and swivel, and its seed (null when the fit's answer is not a hinged candidate).
   *
   * @evidence contracts/development/common.md#meaningful-documentation swivel: Chosen leg-fit branch index and its swivel angle in degrees. seed: Continuation seed returned by the chosen hinged candidate; null when the fit result is not a hinged candidate, even independently of whether a previous seed was supplied.
   * @evidence contracts/development/design.md#principled-representation swivel: Chosen leg-fit branch index and its swivel angle in degrees. seed: Continuation seed returned by the chosen hinged candidate; null when the fit result is not a hinged candidate, even independently of whether a previous seed was supplied.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/HumanLegChain.ts (HumanLegChain.seeded, return).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanLegChain.ISwivel, IAutoMovieSwivelSeed identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type ISeededResult = {
    /** Chosen leg-fit branch index and its swivel angle in degrees. */
    swivel: IAutoMovieMotionHumanLegChain.ISwivel;
    /** Continuation seed returned by the chosen hinged candidate; null when the fit result is not a hinged candidate, even independently of whether a previous seed was supplied. */
    seed: IAutoMovieSwivelSeed | null;
  };
}
