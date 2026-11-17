import type { IAutoMovieMotionHumanBend } from "./IAutoMovieMotionHumanBend";

/**
 * A standing body lowered toward a low target by a strategy, and the trunk
 * pitch that brings the shoulder within reach: the posture transforms the
 * bend law solves its reach and balance on, split from the law so each file
 * holds one responsibility.
 *
 * @evidence contracts/development/common.md#meaningful-documentation lean: How far the hips move back for balance per unit sine of the inclination, metres. pitch: The trunk's inclination, degrees.
 * @evidence contracts/development/design.md#principled-representation lean: How far the hips move back for balance per unit sine of the inclination, metres. pitch: The trunk's inclination, degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/bend.ts (bend.lowering, return); everyday/bendLower.ts (bendLower.solve, return); everyday/bend.ts (bend.plan); handling/pickUpLift.ts (pickUpLift); handling/pickUpPosture.ts (pickUpPosture.lowered).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBend.Strategy identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanBendLower {
  /**
   * A strategy's solved lowering: the balance shift per unit sine of the inclination and the inclination itself.
   *
   * @evidence contracts/development/common.md#meaningful-documentation lean: How far the hips move back for balance per unit sine of the inclination, metres. pitch: The trunk's inclination, degrees.
   * @evidence contracts/development/design.md#principled-representation lean: How far the hips move back for balance per unit sine of the inclination, metres. pitch: The trunk's inclination, degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: everyday/bend.ts (bend.lowering, return); everyday/bendLower.ts (bendLower.solve, return); everyday/bend.ts (bend.plan); handling/pickUpLift.ts (pickUpLift); handling/pickUpPosture.ts (pickUpPosture.lowered).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanBend.Strategy identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ISolved {
    /** The strategy. */
    strategy: Exclude<IAutoMovieMotionHumanBend.Strategy, "auto">;

    /** How far the hips move back for balance per unit sine of the inclination, metres. */
    lean: number;

    /** The trunk's inclination, degrees. */
    pitch: number;
  }
}
