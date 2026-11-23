# src/composition/AutoMovieScheduleWalk.ts#AutoMovieScheduleWalk.create

## @evidence contracts/development/common.md#meaningful-documentation

States the input and that nothing is placed.

## @evidence contracts/development/implementation.md#principled-implementation

The tracks are the laws' own cues.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The record lives as long as the walk.

# src/composition/AutoMovieScheduleWalk.ts#AutoMovieScheduleWalk.instants

## @evidence contracts/development/common.md#meaningful-documentation

States the two sources and the start and end added.

## @evidence contracts/development/implementation.md#principled-implementation

An entry always offers its start and its end unless its events name them.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and one list.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the anchor's events.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/composition/AutoMovieScheduleWalk.ts#AutoMovieScheduleWalk.placed

## @evidence contracts/development/common.md#meaningful-documentation

States what is listed.

## @evidence contracts/development/implementation.md#principled-implementation

The names an error offers as alternatives.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One list.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the names.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/composition/AutoMovieScheduleWalk.ts#AutoMovieScheduleWalk.instant

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the two refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Events of one name are taken in order, as a score repeats a beat.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One filter and two refusals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing event or index is refused with the alternatives, not defaulted.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the events.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/composition/AutoMovieScheduleWalk.ts#AutoMovieScheduleWalk.leading

## @evidence contracts/development/common.md#meaningful-documentation

States what each node kind gives.

## @evidence contracts/development/implementation.md#principled-implementation

The first part is followed down; an `at` begins where its anchor puts it, so it names none.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One recursion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the depth.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
