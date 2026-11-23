# src/motion/human/lexicon/IAutoMovieMotionHumanCrutchStairs.ts#IAutoMovieMotionHumanCrutchStairs

## @evidence contracts/development/common.md#meaningful-documentation

States both orders, their source and every member's meaning.

## @evidence contracts/development/design.md#principled-representation

The flight as the climb gives it, the two crutch props, the injured side and the time of each step.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members `HumanCrutchStairs` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A riser or tread the body cannot climb, crutches without a grip and a tip, or a time of no length is refused at runtime.

# src/motion/human/lexicon/IAutoMovieMotionHumanCrutchStairs.ts#IAutoMovieMotionHumanCrutchStairs.ILaw

## @evidence contracts/development/common.md#meaningful-documentation

States the law and the track reader's inputs, frame and timebase.

## @evidence contracts/development/design.md#principled-representation

The track maps a film second to one crutch's world rigid frame, from its staged frame and the climb's parameters.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The law and the track the scene's two props read, so both share one course.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every crutch frame derives from the same flight the law plans.
