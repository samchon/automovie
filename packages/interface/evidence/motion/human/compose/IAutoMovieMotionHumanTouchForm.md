# src/motion/human/compose/IAutoMovieMotionHumanTouchForm.ts#IAutoMovieMotionHumanTouchForm

## @evidence contracts/development/common.md#meaningful-documentation

lift: The lift's greatest height, a share of the hand's length. travel: The travel's greatest offset each way, a share of the hand's length. speed: The travel's peak speed, metres per second; sets the period when present.

## @evidence contracts/development/design.md#principled-representation

lift: The lift's greatest height, a share of the hand's length. travel: The travel's greatest offset each way, a share of the hand's length. speed: The travel's peak speed, metres per second; sets the period when present.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanTouchForm.ts (AutoMovieMotionHumanTouchForm.curled, kind); compose/AutoMovieMotionHumanTouchForm.ts (AutoMovieMotionHumanTouchForm.period, kind); compose/AutoMovieMotionHumanTouchForm.ts (AutoMovieMotionHumanTouchForm.tangent, tangent); compose/AutoMovieMotionHumanTouchLaid.ts (AutoMovieMotionHumanTouchLaid.bend, tangent); compose/AutoMovieMotionHumanTouchLaid.ts (AutoMovieMotionHumanTouchLaid.laid, tangent); compose/AutoMovieMotionHumanTouchLaid.ts (AutoMovieMotionHumanTouchLaid.rest, tangent).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanTiming.Span identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/compose/IAutoMovieMotionHumanTouchForm.ts#IAutoMovieMotionHumanTouchForm.Kind

## @evidence contracts/development/common.md#meaningful-documentation

States what a kind selects; the namespace states the source and `FORMS` each kind's movement.

## @evidence contracts/development/design.md#principled-representation

The gesture names of the social touch corpus that differ in a surface frame; each maps to one row of `FORMS`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Eight literals, the key of `FORMS`; a law names a kind and never a lift or a travel.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A closed union, so `FORMS` is exhaustive and an unknown kind does not compile.

# src/motion/human/compose/IAutoMovieMotionHumanTouchForm.ts#IAutoMovieMotionHumanTouchForm.Tangent

## @evidence contracts/development/common.md#meaningful-documentation

States the two directions relative to the region's surface.

## @evidence contracts/development/design.md#principled-representation

A surface has two tangent directions; they are named by the world's up projected on it and its perpendicular.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two literals, read by the region's tangent.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A named direction on the surface, not a free vector a law could point off it.

# src/motion/human/compose/IAutoMovieMotionHumanTouchForm.ts#IAutoMovieMotionHumanTouchForm.IForm

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The lift and the travel in hand lengths, the repetition as a span or a peak speed, the curl in degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five members read by the touch stroke.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The speed is optional because only the stroke has a measured one.
