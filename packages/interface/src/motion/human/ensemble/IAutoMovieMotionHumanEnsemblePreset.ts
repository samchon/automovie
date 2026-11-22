import type { IAutoMovieMotionHumanAttribute } from "./IAutoMovieMotionHumanAttribute";

/**
 * A named group's distributions (`HUMAN_ENSEMBLE_PRESETS`): its members'
 * proficiency `p` and each attribute.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a preset holds. Contracts used by HumanEnsembleMembers.resolve, HUMAN_ENSEMBLE_PRESETS.
 * @evidence contracts/development/design.md#principled-representation A distribution per attribute and one for proficiency. Closed choices "elite", "line", "militia", "rabble", "civilians" distinguish the admitted cases.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record `HumanEnsemble.of` reads, and the preset names. Runtime boundary references: ensemble/HumanEnsembleMembers.ts (HumanEnsembleMembers.resolve); ensemble/HUMAN_ENSEMBLE_PRESETS.ts (HUMAN_ENSEMBLE_PRESETS).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union of names, so an unknown preset is a type error. The admitted literal values are declared here directly; runtime handling remains in HumanEnsembleMembers.resolve.
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

/**
 * Contracts used by HumanEnsembleMembers.resolve, HUMAN_ENSEMBLE_PRESETS.
 *
 */
export namespace IAutoMovieMotionHumanEnsemblePreset {
  /**
   * The preset names.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The preset names.
   * @evidence contracts/development/design.md#principled-representation Closed choices "elite", "line", "militia", "rabble", "civilians" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HUMAN_ENSEMBLE_PRESETS.ts (HUMAN_ENSEMBLE_PRESETS).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HUMAN_ENSEMBLE_PRESETS.
   */
  export type Name =
    /** Drilled regulars: proficiency 0.9, discipline 0.95, morale 0.9, the steadiest and most uniform; a parade or a disciplined advance. */
    | "elite"
    /** Line troops: proficiency 0.7, discipline 0.75, morale 0.75. */
    | "line"
    /** Militia: proficiency 0.4, discipline 0.4, morale 0.55; a levy that breaks sooner. */
    | "militia"
    /** A rabble: proficiency 0.25, discipline 0.1, morale 0.35, the most varied; a mob. */
    | "rabble"
    /** Civilians: proficiency 0.4, discipline 0.2, morale 0.7, undrilled but calm; a street crowd. Every value is provisional (`HUMAN_ENSEMBLE_PRESETS`). */
    | "civilians";
}
