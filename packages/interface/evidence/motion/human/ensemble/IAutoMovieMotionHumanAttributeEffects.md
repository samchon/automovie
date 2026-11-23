# src/motion/human/ensemble/IAutoMovieMotionHumanAttributeEffects.ts#IAutoMovieMotionHumanAttributeEffects

## @evidence contracts/development/common.md#meaningful-documentation

States what the table holds and how an effect is read. low: The value at 0. high: The value at 1.

## @evidence contracts/development/design.md#principled-representation

An effect is its two end values; the table is typed by attribute so a reader names its row. low: The value at 0. high: The value at 1.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The rows the ensemble, the cadence, the command latency, the formation's dress and the crowd's steering read. Runtime boundary references: ensemble/HUMAN_ATTRIBUTE_EFFECTS.ts (HUMAN_ATTRIBUTE_EFFECTS).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No row is an outcome. The admitted fields and units are declared here directly; runtime handling remains in HUMAN_ATTRIBUTE_EFFECTS.

# src/motion/human/ensemble/IAutoMovieMotionHumanAttributeEffects.ts#IAutoMovieMotionHumanAttributeEffects.IEffect

## @evidence contracts/development/common.md#meaningful-documentation

low: The value at 0. high: The value at 1.

## @evidence contracts/development/design.md#principled-representation

low: The value at 0. high: The value at 1.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanAttribute.ts (HumanAttribute.effect, effect).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanAttribute.effect.
