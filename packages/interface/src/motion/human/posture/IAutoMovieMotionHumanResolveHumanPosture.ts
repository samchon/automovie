import type { IAutoMoviePose } from "../../../pose/IAutoMoviePose";
import type { IAutoMovieSwivelNear } from "../../../pose/IAutoMovieSwivelNear";
import type { IAutoMovieSwivelSeed } from "../../../pose/IAutoMovieSwivelSeed";
import type { IAutoMovieSeededChainFit } from "../../IAutoMovieSeededChainFit";
import type { AutoMovieHumanLimb } from "./AutoMovieHumanLimb";

/**
 * Companion helpers of {@link resolveHumanPosture}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation pose: The canonical pose. seeds: Each fitted limb's seed. values: Each fitted limb's fit value (`IAutoMovieSeededChainFit.value`), where its fit reports one.
 * @evidence contracts/development/design.md#principled-representation pose: The canonical pose. seeds: Each fitted limb's seed. values: Each fitted limb's fit value (`IAutoMovieSeededChainFit.value`), where its fit reports one.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/resolveHumanPosture.ts (resolveHumanPosture.seeded, return); posture/resolveHumanPosture.ts (resolveHumanPosture.refit, return); posture/resolveHumanPosture.ts (resolveHumanPosture, near); posture/resolveHumanPosture.ts (resolveHumanPosture.seeded, near); posture/resolveHumanPosture.ts (resolveHumanPosture.refit, near); handling/HumanGraspSearch.ts (HumanGraspSearch.fit).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanLimb, IAutoMovieSwivelNear, IAutoMoviePose identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanResolveHumanPosture {
  /**
   * Each limb's nearby fit to continue (`IAutoMovieSwivelNear`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each limb's nearby fit to continue (`IAutoMovieSwivelNear`).
   * @evidence contracts/development/design.md#principled-representation A borrowed partial map gives a nearby fit only for limbs the caller can continue; an absent key requests that limb's ordinary cold fit, not a fabricated seed.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/resolveHumanPosture.ts (resolveHumanPosture, near); posture/resolveHumanPosture.ts (resolveHumanPosture.seeded, near); posture/resolveHumanPosture.ts (resolveHumanPosture.refit, near).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical AutoMovieHumanLimb, IAutoMovieSwivelNear identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type INear = Readonly<
    Partial<Record<AutoMovieHumanLimb, IAutoMovieSwivelNear>>
  >;

  /**
   * A resolved pose with the seed each limb's fit was chosen at; null where a limb's fit has none.
   *
   * @evidence contracts/development/common.md#meaningful-documentation pose: The canonical pose. seeds: Each fitted limb's seed. values: Each fitted limb's fit value (`IAutoMovieSeededChainFit.value`), where its fit reports one.
   * @evidence contracts/development/design.md#principled-representation pose: The canonical pose. seeds: Each fitted limb's seed. values: Each fitted limb's fit value (`IAutoMovieSeededChainFit.value`), where its fit reports one.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: posture/resolveHumanPosture.ts (resolveHumanPosture.seeded, return); posture/resolveHumanPosture.ts (resolveHumanPosture.refit, return); handling/HumanGraspSearch.ts (HumanGraspSearch.fit); perform/HumanSegmentOverlay.ts (HumanSegmentOverlay.overlaid.build); perform/HumanSegmentOverlay.ts (HumanSegmentOverlay.overlaid); perform/HumanSegmentPose.ts (HumanSegmentPose.seeded).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMoviePose, AutoMovieHumanLimb, IAutoMovieSwivelSeed, IAutoMovieSeededChainFit identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface ISeeded {
    /** The canonical pose. */
    pose: IAutoMoviePose;

    /** Each fitted limb's seed. */
    seeds: Partial<Record<AutoMovieHumanLimb, IAutoMovieSwivelSeed | null>>;

    /** Each fitted limb's fit value (`IAutoMovieSeededChainFit.value`), where its fit reports one. */
    values: Partial<
      Record<AutoMovieHumanLimb, IAutoMovieSeededChainFit["value"]>
    >;
  }
}
