# src/motion/human/exercise/IAutoMovieMotionHumanStiltWalk.ts#IAutoMovieMotionHumanStiltWalk.IStilts

## @evidence contracts/development/common.md#meaningful-documentation

The prop under each foot.

## @evidence contracts/development/design.md#principled-representation

One scene id per foot.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two ids.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/motion/human/exercise/IAutoMovieMotionHumanStiltWalk.ts#IAutoMovieMotionHumanStiltWalk.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, frame, unit, range and default.

## @evidence contracts/development/design.md#principled-representation

The two stilts by scene id, the stop as a world floor point in metres and a whole step count.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three members stiltWalk.plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: every member is used by every walk, and reach and support limits remain for the law's runtime refusals.
