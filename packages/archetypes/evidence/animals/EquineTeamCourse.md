# src/animals/EquineTeamCourse.ts#EquineTeamCourse

## @evidence contracts/development/common.md#meaningful-documentation

States the offset geometry, the speed rule, the change pieces and their error, and the stop.

## @evidence contracts/development/implementation.md#principled-implementation

Parallel-curve geometry: a constant normal offset keeps every turn's centre and scales its radius, and equal angular rates keep the horses abreast; the change piece's length is the constant-acceleration distance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Offset the start, scale the turns and speeds, then split each leg whose speed changes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A change that does not fit its leg is refused rather than shortened.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(L) for L legs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh course and retains nothing.
