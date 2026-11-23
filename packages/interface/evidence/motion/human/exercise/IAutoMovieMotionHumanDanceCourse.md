# src/motion/human/exercise/IAutoMovieMotionHumanDanceCourse.ts#IAutoMovieMotionHumanDanceCourse

## @evidence contracts/development/common.md#meaningful-documentation

States each field.

## @evidence contracts/development/design.md#principled-representation

One record a keyed dance law hands the shared footwork.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Duration, keys, carriage, instants, and the optional hands and their holds.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Seconds are the action's own; points are world metres.

# src/motion/human/exercise/IAutoMovieMotionHumanDanceCourse.ts#IAutoMovieMotionHumanDanceCourse.IHands

## @evidence contracts/development/common.md#meaningful-documentation

States each hand's target and what an absent hand keeps.

## @evidence contracts/development/design.md#principled-representation

One optional arm target per side, in the arm target's own frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, returned by a keyed dance's `hands` and reached by the shared footwork.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each side is independent, so any combination of placed hands is meaningful.

# src/motion/human/exercise/IAutoMovieMotionHumanDanceCourse.ts#IAutoMovieMotionHumanDanceCourse.IHold

## @evidence contracts/development/common.md#meaningful-documentation

States the hand, the partner, the held bone and the span as shares of the duration.

## @evidence contracts/development/design.md#principled-representation

The span is two shares of the action's duration; the partner is a scene id and the held part a humanoid bone.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five members a keyed dance law lists in the course's `holds` to record the hand's contact with a partner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The order of `from` and `to` within [0, 1] is not encoded in the type and remains for the producing law.
