# src/motion/human/next/IAutoMovieMotionHumanFall.ts#IAutoMovieMotionHumanFall

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per law of the Fall family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Fall laws and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanFall.ts#IAutoMovieMotionHumanFall.IEnvironmentRecovery

## @evidence contracts/development/common.md#meaningful-documentation

Names the method it parameterises and the law type it aliases unchanged.

## @evidence contracts/development/design.md#principled-representation

An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanEnvironmentRecovery` owns the type; the alias serves this family's `environmentalRecovery` signature.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no member is added, widened or cast, so `environmentalRecovery` takes the type its law reads.

# src/motion/human/next/IAutoMovieMotionHumanFall.ts#IAutoMovieMotionHumanFall.IDivePreset

## @evidence contracts/development/common.md#meaningful-documentation

States the one value the preset fixes and how it is applied.

## @evidence contracts/development/design.md#principled-representation `side` is an `AutoMovieHumanSide`, the person's own side, as the dive law reads it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the fixed key of the rows `goalkeeperDiveLeft` and `goalkeeperDiveRight`; the law's other parameters stay open.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the preset carries no value the law does not read.
