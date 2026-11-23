# src/motion/human/next/IAutoMovieMotionHumanDining.ts#IAutoMovieMotionHumanDining

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per composition of the Dining behaviour, each taking its own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The refrigerator composition and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Opening and shelf choice come from the scene; no hand path, pose or gaze offset is supplied.

# src/motion/human/next/IAutoMovieMotionHumanDining.ts#IAutoMovieMotionHumanDining.IInspectRefrigerator

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and its default.

## @evidence contracts/development/design.md#principled-representation

A prop subject, a shelf number, an opening in degrees and a hand.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The four values the composition reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The opening and the shelf are the scene's; nothing is assumed.

# src/motion/human/next/IAutoMovieMotionHumanDining.ts#IAutoMovieMotionHumanDining.Shelf

## @evidence contracts/development/common.md#meaningful-documentation

Names the admitted shelves.

## @evidence contracts/development/design.md#principled-representation

Closed choices 1, 2, 3, 4 distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shelves the refrigerator prop's affordances name.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly.
