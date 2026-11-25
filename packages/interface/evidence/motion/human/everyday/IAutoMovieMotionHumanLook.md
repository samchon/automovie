# src/motion/human/everyday/IAutoMovieMotionHumanLook.ts#IAutoMovieMotionHumanLook.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each field states its meaning, unit and the default an absent value takes, including that an absent cue means an immediate willed look.

## @evidence contracts/development/design.md#principled-representation

The target is the shared motion target union, tracked every instant; the recruitment is HumanGaze's closed union; the cue is a closed union of the two sensory channels whose reaction times differ; the duration is seconds, and a non-positive one is refused at plan time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by this law and read only by its plan; the target and recruitment types are imported from their owners.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No field names a scene or body; the one invalid combination, an uncued target outside the attended field, depends on where the target is at the start and is refused at plan time.
