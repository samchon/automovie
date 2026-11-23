# src/motion/human/next/IAutoMovieMotionHumanExpression.ts#IAutoMovieMotionHumanExpression

## @evidence contracts/development/design.md#principled-representation

One method per layer builder of the Expression family, each taking the builder's own parameter type and returning the layer.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The affect and breath layers and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing display or option type of its builder; nothing is redefined.

## @evidence contracts/development/common.md#meaningful-documentation

Names each method's parameters with their units.

# src/motion/human/next/IAutoMovieMotionHumanExpression.ts#IAutoMovieMotionHumanExpression.IAffect

## @evidence contracts/development/common.md#meaningful-documentation

The member states its meaning.

## @evidence contracts/development/design.md#principled-representation

The one argument the builder takes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the argument of `affect`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the display type `IAutoMovieMotionHumanAffect` owns.
