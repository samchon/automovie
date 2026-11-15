import type { HumanAttribute } from "./HumanAttribute";

/**
 * A named group's distributions (`HUMAN_ENSEMBLE_PRESETS`): its members'
 * proficiency `p` and each attribute.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a preset holds.
 * @evidence contracts/development/design.md#principled-representation A distribution per attribute and one for proficiency.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The record `HumanEnsemble.of` reads, and the preset names.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union of names, so an unknown preset is a type error.
 */
export interface IHumanEnsemblePreset {
  /** The members' proficiency `p`. */
  proficiency: HumanAttribute.IDistribution;

  /** Each attribute's distribution. */
  attributes: Readonly<Record<HumanAttribute.Name, HumanAttribute.IDistribution>>;
}

/**
 * Companion types of {@link IHumanEnsemblePreset}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the names.
 * @evidence contracts/development/design.md#principled-representation A closed union.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The keys of `HUMAN_ENSEMBLE_PRESETS`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace IHumanEnsemblePreset {
  /** The preset names. */
  export type Name = "elite" | "line" | "militia" | "rabble" | "civilians";
}
