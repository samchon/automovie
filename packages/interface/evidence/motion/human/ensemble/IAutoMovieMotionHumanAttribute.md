# src/motion/human/ensemble/IAutoMovieMotionHumanAttribute.ts#IAutoMovieMotionHumanAttribute.Name

## @evidence contracts/development/common.md#meaningful-documentation

Which members an authored outcome falls on: exactly `count` of those `among` admits, chosen by the seed, and where an attribute is named the members lower in it more often (weighted sampling without replacement with weight `1 - value`, Efraimidis and Spirakis 2006: the largest keys `u^(1 / w)`). The attribute names.

## @evidence contracts/development/design.md#principled-representation

Closed choices "discipline", "fatigue", "morale" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanEnsemble.ts (HumanEnsemble.pick, weighted); skill/HumanResponse.ts (HumanResponse.latency, attributes); ensemble/HumanAttribute.ts (HumanAttribute.NAMES); ensemble/HumanEnsembleMembers.ts (HumanEnsembleMembers.resolve).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanEnsemble.pick.

# src/motion/human/ensemble/IAutoMovieMotionHumanAttribute.ts#IAutoMovieMotionHumanAttribute.IDistribution

## @evidence contracts/development/common.md#meaningful-documentation

shape: Normal (the default) or uniform with that mean and standard deviation; either is clipped to [0, 1].

## @evidence contracts/development/design.md#principled-representation

shape: Normal (the default) or uniform with that mean and standard deviation; either is clipped to [0, 1].

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanAttribute.ts (HumanAttribute.draw, distribution); ensemble/HumanEnsembleMembers.ts (HumanEnsembleMembers.resolve).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanAttribute.draw.
