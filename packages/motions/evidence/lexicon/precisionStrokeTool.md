# src/lexicon/precisionStrokeTool.ts#precisionStrokeTool

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, for whom, the bare and held faces, the squared axis and the second hand.

## @evidence contracts/development/implementation.md#principled-implementation

The tool is the held frame's own reading (`StrikingHeld.read`); a two-handed grip spans two adjacent fists on the handle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The face, the squared tool, then the support.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing working point is refused by the held reader, never defaulted.

## @evidence contracts/development/implementation.md#efficient-algorithms

One forward kinematics of the entry's hand for a bare palm; none for an implement.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The one reading the stroke and its address share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
