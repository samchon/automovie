import type { IAutoMovieProficiency } from "../skill/IAutoMovieProficiency";

/**
 * The shape of the attribute effect table (`HUMAN_ATTRIBUTE_EFFECTS`): what
 * each group attribute moves, each effect read between its value at the
 * attribute's 0 and at its 1 (`HumanAttribute.effect`).
 */
export interface IAutoMovieMotionHumanAttributeEffects {
  /** What discipline moves. */
  discipline: {
    /** The proficiency axes it replaces. */
    axes: readonly IAutoMovieProficiency.Axis[];

    /**
     * The share of members locked to a beat: 0.62 at discipline 0, all at 1 (a
     * drilled troop) (`HUMAN_ATTRIBUTE_EFFECTS`; Nessler and Gilliland 2009).
     */
    lock: IAutoMovieMotionHumanAttributeEffects.IEffect;

    /**
     * The phase-correction gain toward a beat: 0.3 at discipline 0 to 0.7 at 1;
     * the higher gain keeps the step closer to the beat (provisional, no
     * measured table located).
     */
    correction: IAutoMovieMotionHumanAttributeEffects.IEffect;

    /**
     * The factor on the dress bound: 2 at discipline 0, 1 at 1, so a drilled
     * member keeps its slot twice as tightly (provisional).
     */
    dress: IAutoMovieMotionHumanAttributeEffects.IEffect;
  };

  /** What fatigue moves. */
  fatigue: {
    /**
     * The factor on a gait's speed: 1 fresh at fatigue 0 to 0.8 exhausted at 1,
     * the `weary` manner's pace (`AutoMovieMotionManner.PRESETS`).
     */
    pace: IAutoMovieMotionHumanAttributeEffects.IEffect;
  };

  /** What morale moves. */
  morale: {
    /**
     * The factor on a response latency's mean: 1.3 at morale 0 (hesitant) to 1
     * at 1 (provisional).
     */
    latency: IAutoMovieMotionHumanAttributeEffects.IEffect;

    /**
     * The factor on a fleeing member's desired speed: 1.5 at morale 0 (panic,
     * about 1.5 against 1 m/s, Helbing, Farkas and Vicsek 2000) to 1 at morale
     * 1.
     */
    speed: IAutoMovieMotionHumanAttributeEffects.IEffect;

    /**
     * The herding share, the weight of the neighbours' mean direction: 0.4 at
     * morale 0 to 0 at 1 (provisional).
     */
    herding: IAutoMovieMotionHumanAttributeEffects.IEffect;

    /**
     * The factor on a fleeing member's individual fluctuation, the spread of
     * its drawn desired speed: 2 at morale 0 to 1 at 1 (provisional).
     */
    fluctuation: IAutoMovieMotionHumanAttributeEffects.IEffect;
  };
}

/** Contracts used by HUMAN_ATTRIBUTE_EFFECTS. */
export namespace IAutoMovieMotionHumanAttributeEffects {
  /** One effect: its value at the attribute's 0 and at its 1. */
  export interface IEffect {
    /** The value at 0. */
    low: number;

    /** The value at 1. */
    high: number;
  }
}
