# src/lexicon/HumanBoardHandover.ts#HumanBoardHandover.kept

## @evidence contracts/development/common.md#meaningful-documentation

States what is kept, by what and how a replan reads it.

## @evidence contracts/development/implementation.md#principled-implementation

The hand-over's instants are the flight's own shares, so one planning serves every tempo of the same boarding.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One lookup, one rescale.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A boarding at another start or by another performer plans its own.

## @evidence contracts/development/implementation.md#efficient-algorithms

One planning per boarding, however many replans.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every replan of the same boarding reads the one planning.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Kept weakly by the boarding's parameters and released with them.

# src/lexicon/HumanBoardHandover.ts#HumanBoardHandover.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the two instants and when none is planned.

## @evidence contracts/development/implementation.md#principled-implementation

Every instant is admitted by the course's own still problem (`AutoMovieMotionHumanArmPlanned.stands`), so admission and course agree: the first hand alone until it no longer holds, the other hand taking at the first instant both hold together, the first letting go at the last instant from there both still do.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The first hand's span, then the shared span.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A hand-over no instant of which holds both hands is none; nothing is stretched.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most seventeen still problems of one hand and seventeen of two, on the flight's sixteen even samples.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Run once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a small record.

# src/lexicon/HumanBoardHandover.ts#HumanBoardHandover.waist

## @evidence contracts/development/common.md#meaningful-documentation

States the region, the body it is read on and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

The body's own surface region placed on its displayed bone (`resolveAutoMovieHumanoidSurfaces.place`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One bone read, one placement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The partner is read where displayed at the second; no point is invented.

## @evidence contracts/development/implementation.md#efficient-algorithms

One demanded bone a call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
