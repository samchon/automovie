# src/capture/planMotionCaptureInstants.ts#planMotionCaptureInstants

## @evidence contracts/development/common.md#meaningful-documentation

States the resolution and why, how coinciding instants merge and keep their names, and the order.

## @evidence contracts/development/implementation.md#principled-implementation

A capture names a cell by its second to the millisecond and refuses two cells of one name, so instants that write alike are one cell; their labels are joined rather than one chosen.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map keyed by the millisecond text, read back in insertion order.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No instant is dropped without its label, and a repeated label is written once.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the instants.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure mapping of one case's times.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records and keeps nothing.
