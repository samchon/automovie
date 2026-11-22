import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanChainCore,
  IAutoMovieMotionTarget,
} from "@automovie/interface";

/**
 * First aid on a lying or seated partner composed from shipped actions
 * (#3983): kneeling beside the partner, chest compressions, a pulse check
 * and pressure on a wound. Each appends shipped kneel and touch actions to
 * the carer's chain, so they are fitted, refused and checked as those
 * actions are.
 *
 * Compressions follow the American Heart Association 2020 adult guideline:
 * 100 to 120 a minute, 30 compressions to 2 breaths. Both palms press the
 * partner's lower sternum, one hand over the other, the arms straight
 * (`arms: "straight"`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each act, its rhythm and its source.
 * @evidence contracts/development/design.md#principled-representation Each act is data over the shipped kneel and touch actions, targeting the partner's named regions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the compositions the care scenes use.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No posture is authored here; the touch law fits and refuses each contact.
 */
export namespace composeHumanCare {
  /** Compressions in one cycle (AHA 2020: 30 compressions to 2 breaths). */
  export const COMPRESSIONS: number = 30;

  /** Seconds a pulse is felt for (the 10 s check of AHA 2020 basic life support). */
  export const PULSE_HOLD: number = 10;

  /** Where a pulse is felt: the carotid at the neck or the radial at the wrist. */
  export type PulseSite = "carotid" | "radial";

  /**
   * Kneel on both knees beside the partner and stay down for the care that
   * follows, the right knee coming down at the floor point beside the
   * partner, so the knees end against the side of a lying partner rather
   * than a reverse lunge back from it.
   *
   * @param chain The carer's chain.
   * @param at The floor point beside the partner the right knee comes down on.
   * @returns The chain with the kneel appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the posture and the knee's place.
   * @evidence contracts/development/implementation.md#principled-implementation The shipped both-knee kneel at a named knee point without the rise.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One append.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The kneel law places and refuses the knees.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One append.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call appends to its own chain.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function kneelBeside<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    at: IAutoMovieMotionTarget,
  ): Chain {
    return chain.act("kneel", { kind: "both", hold: 0, rise: false, at });
  }

  /**
   * One cycle of chest compressions: both palms press the partner's sternum.
   *
   * @param chain The carer's chain.
   * @param partner The partner's subject.
   * @returns The chain with the compressions appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the target and the count.
   * @evidence contracts/development/implementation.md#principled-implementation The shipped two-hand press on the partner's sternum, repeated `COMPRESSIONS` times.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One append.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The touch law fits and refuses the contact; the rate is the law's own press timing.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One append.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call appends to its own chain.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function compressions<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    partner: string,
  ): Chain {
    return chain.act("touch", {
      target: { kind: "person", subject: partner, region: "sternum" },
      other: { kind: "person", subject: partner, region: "sternum" },
      kind: "press",
      effector: "palm",
      arms: "straight",
      count: COMPRESSIONS,
      hold: 0,
    });
  }

  /**
   * Feel the partner's pulse with the fingertips for `PULSE_HOLD` seconds.
   *
   * @param chain The carer's chain.
   * @param partner The partner's subject.
   * @param site The carotid or the radial pulse.
   * @param side The feeling hand; the right when absent.
   * @returns The chain with the check appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the sites and the hold.
   * @evidence contracts/development/implementation.md#principled-implementation A fingertip hold on the partner's neck or wrist region.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One append.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The touch law fits and refuses the contact.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One append.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call appends to its own chain.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pulse<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    partner: string,
    site: PulseSite,
    side: AutoMovieHumanSide = "right",
  ): Chain {
    const region: AutoMovieHumanoidRegion =
      site === "carotid" ? "neckLeft" : "wristLeft";
    return chain.act("touch", {
      target: { kind: "person", subject: partner, region },
      hand: side,
      kind: "hold",
      effector: "fingertips",
      hold: PULSE_HOLD,
    });
  }

  /**
   * Press a wound with both palms and hold.
   *
   * @param chain The carer's chain.
   * @param partner The partner's subject.
   * @param region The wounded region.
   * @param hold Seconds the pressure is held.
   * @returns The chain with the pressure appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the target and the hold.
   * @evidence contracts/development/implementation.md#principled-implementation The shipped two-hand press held on the partner's region.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One append.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The touch law fits and refuses the contact.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One append.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call appends to its own chain.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function pressWound<Chain extends IAutoMovieMotionHumanChainCore>(
    chain: Chain,
    partner: string,
    region: AutoMovieHumanoidRegion,
    hold: number,
  ): Chain {
    return chain.act("touch", {
      target: { kind: "person", subject: partner, region },
      other: { kind: "person", subject: partner, region },
      kind: "press",
      effector: "palm",
      count: 1,
      hold,
    });
  }
}
