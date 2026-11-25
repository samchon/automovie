import type { IAutoMovieMotionHumanAttribute } from "./IAutoMovieMotionHumanAttribute";

/**
 * A named group's distributions (`HUMAN_ENSEMBLE_PRESETS`): its members'
 * proficiency `p` and each attribute.
 */
export interface IAutoMovieMotionHumanEnsemblePreset {
  /** The members' proficiency `p`. */
  proficiency: IAutoMovieMotionHumanAttribute.IDistribution;

  /** Each attribute's distribution. */
  attributes: Readonly<
    Record<
      IAutoMovieMotionHumanAttribute.Name,
      IAutoMovieMotionHumanAttribute.IDistribution
    >
  >;
}

/** Contracts used by HumanEnsembleMembers.resolve, HUMAN_ENSEMBLE_PRESETS. */
export namespace IAutoMovieMotionHumanEnsemblePreset {
  /** The preset names. */
  export type Name =
    /**
     * Drilled regulars: proficiency 0.9, discipline 0.95, morale 0.9, the
     * steadiest and most uniform; a parade or a disciplined advance.
     */
    | "elite"
    /** Line troops: proficiency 0.7, discipline 0.75, morale 0.75. */
    | "line"
    /**
     * Militia: proficiency 0.4, discipline 0.4, morale 0.55; a levy that breaks
     * sooner.
     */
    | "militia"
    /**
     * A rabble: proficiency 0.25, discipline 0.1, morale 0.35, the most varied;
     * a mob.
     */
    | "rabble"
    /**
     * Civilians: proficiency 0.4, discipline 0.2, morale 0.7, undrilled but
     * calm; a street crowd. Every value is provisional
     * (`HUMAN_ENSEMBLE_PRESETS`).
     */
    | "civilians";
}
