# src/lexicon/ankleRidePedalFoot.ts#ankleRidePedalFoot

## @evidence contracts/development/common.md#meaningful-documentation

States what turns, about what, how far and when nothing changes.

## @evidence contracts/development/implementation.md#principled-implementation

The ball stays where the goal puts it and the ankle moves on its circle about the ball's lateral axis; the least turn that reaches is found by bisection, the distance being monotonic in the turn up to `ankling`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The ball, the turn as a function of an angle, the distance, the search.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A pedal beyond even `ankling` leaves the foot short of it, which the contact audit reports; a refusal with the saddle height that fits is owed.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four distance trials (none, the two signs and `ankling`) and twenty-four bisections; each trial is one rotation about the ball's prepared axis.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The ball, the axis and the contact are read once per call and shared by every trial; the returned goal is placed by the same function the trials measure.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; it returns the goal given or a new one.
