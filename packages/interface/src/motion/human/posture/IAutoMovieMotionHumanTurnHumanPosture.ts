import type { IAutoMovieMotionHumanPosture } from "./IAutoMovieMotionHumanPosture";
import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";

/**
 * Contracts used by turnHumanPosture, HumanTrunk.resolve, HumanCarriedLift.over.mix, resolveHumanPosture.seeded.
 *
 * @evidence contracts/development/common.md#meaningful-documentation position: The root's world position, metres.
 * @evidence contracts/development/design.md#principled-representation position: The root's world position, metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/turnHumanPosture.ts (turnHumanPosture, return); everyday/HumanTrunk.ts (HumanTrunk.resolve); lexicon/HumanCarriedLift.ts (HumanCarriedLift.over.mix); posture/resolveHumanPosture.ts (resolveHumanPosture.seeded).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion, IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanTurnHumanPosture {
  /**
   * A posture's root and goals after its whole-body rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation position: The root's world position, metres.
   * @evidence contracts/development/design.md#principled-representation position: The root's world position, metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/turnHumanPosture.ts (turnHumanPosture, return); everyday/HumanTrunk.ts (HumanTrunk.resolve); lexicon/HumanCarriedLift.ts (HumanCarriedLift.over.mix); posture/resolveHumanPosture.ts (resolveHumanPosture.seeded).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion, IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ITurned {
    /** The root's world position, metres. */
    position: IAutoMovieVector3;

    /** The root's world rotation, unit. */
    rotation: IAutoMovieQuaternion;

    /** The limb goals, world goals turned and attached ones kept. */
    limbs: IAutoMovieMotionHumanPosture["limbs"];
  }
}
