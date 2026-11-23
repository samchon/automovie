# src/motion/human/lexicon/IAutoMovieMotionHumanCrutchWalk.ts#IAutoMovieMotionHumanCrutchWalk

## @evidence contracts/development/common.md#meaningful-documentation

States the three gaits, their orders and where the weight goes.

## @evidence contracts/development/design.md#principled-representation

Two staged crutch props, the body's floor stations and a closed gait choice.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members `HumanCrutchWalk` reads, with the aided walk's own station record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No crutch or foot place is typed; each follows the stations and the crutches' own staged frames.

# src/motion/human/lexicon/IAutoMovieMotionHumanCrutchWalk.ts#IAutoMovieMotionHumanCrutchWalk.Pattern

## @evidence contracts/development/common.md#meaningful-documentation

Names the three clinical crutch gaits; the law states each one's order.

## @evidence contracts/development/design.md#principled-representation

A closed union of the gaits in Physiopedia's crutch-gait classification that the law performs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The walk's `pattern` member reads it and HumanCrutchWalk's plan branches on it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per gait, with no optional fields to combine.

# src/motion/human/lexicon/IAutoMovieMotionHumanCrutchWalk.ts#IAutoMovieMotionHumanCrutchWalk.ILaw

## @evidence contracts/development/common.md#meaningful-documentation

States the law and the track reader's inputs, frame and timebase.

## @evidence contracts/development/design.md#principled-representation

The track maps a film second to one crutch's world rigid frame, from its staged frame, the walk's parameters and its side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The law the vocabulary registers and the track the scene's two props read, so both share one course.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every crutch frame derives from the same stations the law plans.
