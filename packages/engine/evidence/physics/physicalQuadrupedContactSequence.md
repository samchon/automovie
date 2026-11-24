# src/physics/physicalQuadrupedContactSequence.ts#physicalQuadrupedContactSequence

## @evidence contracts/development/common.md#meaningful-documentation

States the transitions taken, the past phases kept, how the current phase is extended or closed, how groups of transitions open phases, the last phase's second and the capacity stop.

## @evidence contracts/development/implementation.md#principled-implementation

A port of `QuadrupedTimedContactSequence.update` (l.92-219). Transitions at or after now are collected and stably sorted by time, as `ArraySorter`'s bubble sort with a strict comparison is stable (l.10-29); phases starting at or after now are dropped (`TimeIntervalTools` l.93-102) and at most five kept (l.138-143); the current phase is extended with refreshed soles or closed now, dropping the oldest (l.145-166); each group of equal times opens a phase (l.168-191); the last lasts one second (l.192).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Collect, retain, extend or close, then open, as the reference orders them; `open` mirrors `createNewContactPhase`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The non-null assertions follow `open`'s null only at capacity, which cannot be reached before the loop with five retained phases. The step count is bounded by the DCM planner's 8, well inside the reference's transition array.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(s log s) in the steps for the sort, linear in the retained phases.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It copies its input and returns a new sequence.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; the returned sequence holds at most `CAPACITY` phases.

# src/physics/physicalQuadrupedContactSequence.ts#physicalQuadrupedContactSequence

## @evidence contracts/development/common.md#meaningful-documentation

Documents the phase and the capacities with their sources.

## @evidence contracts/development/design.md#principled-representation

`QuadrupedTimedContactPhase` and the DCM planner's sequence capacities.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the centre-of-pressure trajectory and the DCM planner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/physics/physicalQuadrupedContactSequence.ts#physicalQuadrupedContactSequence.IPhase

## @evidence contracts/development/common.md#meaningful-documentation

Documents the interval, the contact state and the soles with units.

## @evidence contracts/development/design.md#principled-representation

`QuadrupedTimedContactPhase`'s interval, contact state and sole positions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Kept in the DCM planner's state and read by the centre-of-pressure trajectory.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All members required.
