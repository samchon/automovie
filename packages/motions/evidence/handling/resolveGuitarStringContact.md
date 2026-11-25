# src/handling/resolveGuitarStringContact.ts#resolveGuitarStringContact

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the three sites, the model frame and the distance unit.

## @evidence contracts/development/implementation.md#principled-implementation

Intersects the finite bar axes and requires a distinct projected soundboard centre inside the string. Their relative order sets the sweep orientation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolve the bars and soundboard, then find the fret crossing, pluck site and nearest lateral neighbour.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rejects remote, parallel or non-intersecting fret and string bars, with no fallback contact.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans the rigid affordance list a bounded number of times.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both stopped notes and chords use the same intersection and projection.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only contact vectors leave the function.
