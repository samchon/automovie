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
export interface IHumanAttributeEffects {
  /** What discipline moves. */
  discipline: {
    /** The proficiency axes it replaces. */
    axes: readonly IAutoMovieProficiency.Axis[];

    /** The share of members locked to a beat. */
    lock: IHumanAttributeEffects.IEffect;

    /** The phase-correction gain toward a beat. */
    correction: IHumanAttributeEffects.IEffect;

    /** The factor on the dress bound. */
    dress: IHumanAttributeEffects.IEffect;
  };

  /** What fatigue moves. */
  fatigue: {
    /** The factor on a gait's speed. */
    pace: IHumanAttributeEffects.IEffect;
  };

  /** What morale moves. */
  morale: {
    /** The factor on a response latency's mean. */
    latency: IHumanAttributeEffects.IEffect;

    /** The factor on a fleeing member's desired speed. */
    speed: IHumanAttributeEffects.IEffect;

    /** The herding share. */
    herding: IHumanAttributeEffects.IEffect;
  };
}

/**
 * Companion types of {@link IHumanAttributeEffects}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning.
 * @evidence contracts/development/design.md#principled-representation The two ends of a linear effect.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace IHumanAttributeEffects {
  /** One effect: its value at the attribute's 0 and at its 1. */
  export interface IEffect {
    /** The value at 0. */
    low: number;

    /** The value at 1. */
    high: number;
  }
}
