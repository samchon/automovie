# src/perform/HumanSegmentStill.ts#HumanSegmentStill.within

## @evidence contracts/development/common.md#meaningful-documentation

States what is certified and over what.

## @evidence contracts/development/implementation.md#principled-implementation

With no layer, overlay, hold or stop, one action active over the interval (`HumanSegmentSelection.last` is the same at both ends, so at every second between) and its offset decayed at the start, the pose is constant where the clamped local second is, or where the plan declares its posture still.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One gate per term of the shown pose, then the plan's clamped interval.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Any term that may change refuses the certificate; nothing is estimated.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Two selections and constant checks.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads the person's current state.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/perform/HumanSegmentStill.ts#HumanSegmentStill.representative

## @evidence contracts/development/common.md#meaningful-documentation

States which second is returned and when none is.

## @evidence contracts/development/implementation.md#principled-implementation

The plan's end is taken as the least film second whose local second reaches the duration, so the clamped input there is the duration itself; the window's start is the plan's own; `within` certifies the stretch between.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One selection, one candidate second, one certificate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A candidate the certificate refuses is not returned; no tolerance stands for equality of the clamped input.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant checks and two selections.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads the person's current state.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
