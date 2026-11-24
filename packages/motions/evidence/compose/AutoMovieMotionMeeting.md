# src/compose/AutoMovieMotionMeeting.ts#AutoMovieMotionMeeting

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, that the roles' order is free, the two `participant` refusals (the count of roles with its range, a role the kind does not name with its roles) and the `window` refusal that names the earliest second the contact can be made.

## @evidence contracts/development/implementation.md#principled-implementation

The roles are sorted by name and then subject before anything is read, so the result does not depend on who asks. The frame sits at the mean floor point heading from the first role to the second; each contact is the kind's own placement or the mean of the roles' default places; each shared instant is the latest of the roles' natural ones, since the pair can meet only when the slower role arrives; a window moves the instants later to its start and holds the contact to its end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validate, order, frame, contacts, instants, record, in that order with one local each.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An empty, oversized or misnamed role list is refused with the kind's roles named. Roles on one floor point take the first role's heading instead of an undefined direction. A role count is checked against the kind's, not each name's multiplicity.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two roles and a few contacts; one sort and one pass each.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Default places resolve through `AutoMovieMotionHumanTarget.fallback` and the frame change through `HumanFrame.local`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function; the record keeps no body, posture or bone.

# src/compose/AutoMovieMotionMeeting.ts#AutoMovieMotionMeeting.place

## @evidence contracts/development/common.md#meaningful-documentation

States the place's point and facing, when it is solid and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A contact between two people is approached from each one's own side, so the place faces back at the asking performer along the floor and the two roles get opposite normals on one point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup, one frame change and one normal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unknown contact throws with the meeting's contacts named; a performer standing on the contact takes the direction behind its own heading instead of a zero normal.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Returns `AutoMovieMotionHumanTarget.IPlace`, so `hand` and the phrases take it like any resolved target.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/compose/AutoMovieMotionMeeting.ts#AutoMovieMotionMeeting.local

## @evidence contracts/development/common.md#meaningful-documentation

States the conversion and both time origins.

## @evidence contracts/development/implementation.md#principled-implementation

Film seconds less the action's start are the action's own seconds, the time its clock is built on.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record of three differences.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None: an instant before the action's start comes out negative and is not clamped, so the law that pins its clock to it sees that it started too late.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Three subtractions with nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
