# src/motion/human/lexicon/IAutoMovieMotionHumanStuntFall.ts#IAutoMovieMotionHumanStuntFall.Exit

## @evidence contracts/development/common.md#meaningful-documentation

States the three take-offs.

## @evidence contracts/development/design.md#principled-representation

A closed choice of take-off velocity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the high fall.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted values are declared here directly.

# src/motion/human/lexicon/IAutoMovieMotionHumanStuntFall.ts#IAutoMovieMotionHumanStuntFall.IStairs

## @evidence contracts/development/common.md#meaningful-documentation

States each member and default.

## @evidence contracts/development/design.md#principled-representation

The stair prop and whether the fall is the controlled seat slide.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fields the tumble reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The treads come from the prop's steps.

# src/motion/human/lexicon/IAutoMovieMotionHumanStuntFall.ts#IAutoMovieMotionHumanStuntFall.IHigh

## @evidence contracts/development/common.md#meaningful-documentation

States each member, unit and default.

## @evidence contracts/development/design.md#principled-representation

The take-off, the optional pad, and the optional descender's final speed in metres per second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The fields the high fall reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The drop and the pad's top come from the scene.

# src/motion/human/lexicon/IAutoMovieMotionHumanStuntFall.ts#IAutoMovieMotionHumanStuntFall.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names the variants.

## @evidence contracts/development/design.md#principled-representation

A closed discriminated union on kind.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The variants planStuntFall dispatches on.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Alternatives are separated by kind rather than optional fields.
