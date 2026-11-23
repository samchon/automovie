# src/compose/AutoMovieMotionHumanRise.ts#AutoMovieMotionHumanRise.foot

## @evidence contracts/development/common.md#meaningful-documentation

States each input and the pivot.

## @evidence contracts/development/implementation.md#principled-implementation

A rigid turn of the foot about the metatarsophalangeal joint held at its flat place.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pivot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The joint's place is read off the flat foot, not assumed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates to `HumanFoot.pivot`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanRise.ts#AutoMovieMotionHumanRise.lift

## @evidence contracts/development/common.md#meaningful-documentation

States what the travel is the mean of and its frame.

## @evidence contracts/development/implementation.md#principled-implementation

The pelvis rides the two ankles, so it takes their mean travel and the legs keep their lengths.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two raised feet and one mean.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both feet are read, so feet of unequal headings are carried.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `foot`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionHumanRise.ts#AutoMovieMotionHumanRise.legs

## @evidence contracts/development/common.md#meaningful-documentation

States what each leg is given and the argument's units.

## @evidence contracts/development/implementation.md#principled-implementation

The foot's rigid pivot with the toes' joint extended by the same angle, which leaves the toes on the floor.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One write per leg: the toes' joint and the leg's goal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The goal is solved on the posture written so far, so a raised or leaned root is followed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `foot` and `AutoMovieMotionHumanLeg.goal`.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work per written second.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The primitives close over their props and retain no current placement, posture, time or FK workspace. Their declared input demand keeps the current root and own leg, including unchanged own-leg joints, while unrelated primitive writers may be omitted.
