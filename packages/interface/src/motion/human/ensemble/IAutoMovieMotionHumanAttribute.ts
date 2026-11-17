/**
 * A group member's attributes: the named qualities a group's distribution
 * gives each member a number of, and the keyed draws that give them.
 *
 * An attribute is a value in [0, 1]: `discipline` (drill and steadiness, 1
 * the best drilled), `fatigue` (0 fresh, 1 spent) and `morale` (0 broken, 1
 * steady). A group states each as a distribution (`IDistribution`); each
 * member draws its own value from a stream keyed by the chain seed, the
 * ensemble's id, the member's index and the name drawn, so adding a member
 * or an attribute leaves every other draw bit-identical (the keyed streams
 * of `HumanSkill.stream`, Salmon et al. 2011). What an attribute moves is
 * `HUMAN_ATTRIBUTE_EFFECTS`'s; an attribute never decides an outcome.
 *
 * @evidence contracts/development/common.md#meaningful-documentation shape: Normal (the default) or uniform with that mean and standard deviation; either is clipped to [0, 1].
 * @evidence contracts/development/design.md#principled-representation shape: Normal (the default) or uniform with that mean and standard deviation; either is clipped to [0, 1].
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanEnsemble.ts (HumanEnsemble.pick, weighted); skill/HumanResponse.ts (HumanResponse.latency, attributes); ensemble/HumanAttribute.ts (HumanAttribute.draw, distribution); ensemble/HumanAttribute.ts (HumanAttribute.NAMES); ensemble/HumanEnsembleMembers.ts (HumanEnsembleMembers.resolve).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanEnsemble.pick.
 */
export namespace IAutoMovieMotionHumanAttribute {
  /**
   * Which members an authored outcome falls on: exactly `count` of those `among` admits, chosen by the seed, and where an attribute is named the members lower in it more often (weighted sampling without replacement with weight `1 - value`, Efraimidis and Spirakis 2006: the largest keys `u^(1 / w)`). The attribute names.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Which members an authored outcome falls on: exactly `count` of those `among` admits, chosen by the seed, and where an attribute is named the members lower in it more often (weighted sampling without replacement with weight `1 - value`, Efraimidis and Spirakis 2006: the largest keys `u^(1 / w)`). The attribute names.
   * @evidence contracts/development/design.md#principled-representation Closed choices "discipline", "fatigue", "morale" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanEnsemble.ts (HumanEnsemble.pick, weighted); skill/HumanResponse.ts (HumanResponse.latency, attributes); ensemble/HumanAttribute.ts (HumanAttribute.NAMES); ensemble/HumanEnsembleMembers.ts (HumanEnsembleMembers.resolve).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanEnsemble.pick.
   */
  export type Name = "discipline" | "fatigue" | "morale";

  /**
   * A group's distribution of one quantity on [0, 1].
   *
   * @evidence contracts/development/common.md#meaningful-documentation shape: Normal (the default) or uniform with that mean and standard deviation; either is clipped to [0, 1].
   * @evidence contracts/development/design.md#principled-representation shape: Normal (the default) or uniform with that mean and standard deviation; either is clipped to [0, 1].
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: ensemble/HumanAttribute.ts (HumanAttribute.draw, distribution); ensemble/HumanEnsembleMembers.ts (HumanEnsembleMembers.resolve).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanAttribute.draw.
   */
  export interface IDistribution {
    /** The mean, in [0, 1]. */
    mean: number;

    /** The standard deviation, at least 0; 0 gives every member the mean. */
    spread: number;

    /** Normal (the default) or uniform with that mean and standard deviation; either is clipped to [0, 1]. */
    shape?: "normal" | "uniform";
  }
}
