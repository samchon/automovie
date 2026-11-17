import type { IAutoMovieMotionHumanAttribute } from "./IAutoMovieMotionHumanAttribute";

/**
 * A named group's distributions (`HUMAN_ENSEMBLE_PRESETS`): its members'
 * proficiency `p` and each attribute.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a preset holds.
 * @evidence contracts/development/design.md#principled-representation A distribution per attribute and one for proficiency.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record `HumanEnsemble.of` reads, and the preset names.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union of names, so an unknown preset is a type error.
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
 * @evidence contracts/development/common.md#meaningful-documentation Contracts used by HumanEnsembleMembers.resolve, HUMAN_ENSEMBLE_PRESETS.
 * @evidence contracts/development/design.md#principled-representation Closed choices "elite", "line", "militia", "rabble", "civilians" distinguish the admitted cases.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanEnsembleMembers.ts (HumanEnsembleMembers.resolve); ensemble/HUMAN_ENSEMBLE_PRESETS.ts (HUMAN_ENSEMBLE_PRESETS).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanEnsembleMembers.resolve.
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
  export type Name = "elite" | "line" | "militia" | "rabble" | "civilians";
}
