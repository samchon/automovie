# src/motion/human/lexicon/IAutoMovieMotionHumanAirborneShape.ts#IAutoMovieMotionHumanAirborneShape

## @evidence contracts/development/common.md#meaningful-documentation

The body shapes held in flight (#3428): tuck, pike, layout, straddle and the twisting arm sets, each a layer laid over a jump's flight window, so the flight pass (`HumanPerformanceFlight`) reads the composed shape and turns the body by it: a tuck turns faster than a layout by the ratio of their moments about the somersault axis.

## @evidence contracts/development/design.md#principled-representation

Closed choices "tuck", "pike", "layout", "straddle", "armsIn", "armsUp" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanAirborneShape.ts (HumanAirborneShape.layer, shape); lexicon/HumanAirborneShape.ts (HumanAirborneShape.SHAPES); lexicon/HumanAirborneShape.ts (HumanAirborneShape.ANGLES).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanAirborneShape.layer.

# src/motion/human/lexicon/IAutoMovieMotionHumanAirborneShape.ts#IAutoMovieMotionHumanAirborneShape.Shape

## @evidence contracts/development/common.md#meaningful-documentation

A shape as a layer. One shape.

## @evidence contracts/development/design.md#principled-representation

Closed choices "tuck", "pike", "layout", "straddle", "armsIn", "armsUp" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanAirborneShape.ts (HumanAirborneShape.layer, shape); lexicon/HumanAirborneShape.ts (HumanAirborneShape.SHAPES); lexicon/HumanAirborneShape.ts (HumanAirborneShape.ANGLES).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanAirborneShape.layer.
