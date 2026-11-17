import type { IAutoMovieProficiency } from "../skill/IAutoMovieProficiency";

/**
 * The shape of the attribute effect table (`HUMAN_ATTRIBUTE_EFFECTS`): what
 * each group attribute moves, each effect read between its value at the
 * attribute's 0 and at its 1 (`HumanAttribute.effect`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the table holds and how an effect is read.
 * @evidence contracts/development/design.md#principled-representation An effect is its two end values; the table is typed by attribute so a reader names its row.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The rows the ensemble, the cadence, the command latency, the formation's dress and the crowd's steering read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row is an outcome.
 */
export interface IAutoMovieMotionHumanAttributeEffects {
  /** What discipline moves. */
  discipline: {
    /** The proficiency axes it replaces. */
    axes: readonly IAutoMovieProficiency.Axis[];

    /** The share of members locked to a beat. */
    lock: IAutoMovieMotionHumanAttributeEffects.IEffect;

    /** The phase-correction gain toward a beat. */
    correction: IAutoMovieMotionHumanAttributeEffects.IEffect;

    /** The factor on the dress bound. */
    dress: IAutoMovieMotionHumanAttributeEffects.IEffect;
  };

  /** What fatigue moves. */
  fatigue: {
    /** The factor on a gait's speed. */
    pace: IAutoMovieMotionHumanAttributeEffects.IEffect;
  };

  /** What morale moves. */
  morale: {
    /** The factor on a response latency's mean. */
    latency: IAutoMovieMotionHumanAttributeEffects.IEffect;

    /** The factor on a fleeing member's desired speed. */
    speed: IAutoMovieMotionHumanAttributeEffects.IEffect;

    /** The herding share. */
    herding: IAutoMovieMotionHumanAttributeEffects.IEffect;

    /** The factor on a fleeing member's individual fluctuation: the spread of its drawn desired speed. */
    fluctuation: IAutoMovieMotionHumanAttributeEffects.IEffect;
  };
}

/**
 * Contracts used by HUMAN_ATTRIBUTE_EFFECTS.
 *
 * @evidence contracts/development/common.md#meaningful-documentation low: The value at 0. high: The value at 1.
 * @evidence contracts/development/design.md#principled-representation low: The value at 0. high: The value at 1.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HUMAN_ATTRIBUTE_EFFECTS.ts (HUMAN_ATTRIBUTE_EFFECTS).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HUMAN_ATTRIBUTE_EFFECTS.
 */
export namespace IAutoMovieMotionHumanAttributeEffects {
  /**
   * One effect: its value at the attribute's 0 and at its 1.
   *
   * @evidence contracts/development/common.md#meaningful-documentation low: The value at 0. high: The value at 1.
   * @evidence contracts/development/design.md#principled-representation low: The value at 0. high: The value at 1.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanAttribute.ts (HumanAttribute.effect, effect).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted fields and units are declared here directly; runtime handling remains in HumanAttribute.effect.
   */
  export interface IEffect {
    /** The value at 0. */
    low: number;

    /** The value at 1. */
    high: number;
  }
}
