# src/film/copyPolygonBodyCue.ts#copyPolygonBodyCue

## @evidence contracts/development/common.md#meaningful-documentation

States the admitted-input premise and ownership of nested values.

## @evidence contracts/development/implementation.md#principled-implementation

Copies the shared cue fields and includes translation only for a detached part.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shared record holds common fields. The kind branch copies the detach displacement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps timing, quaternion sign and translation as admitted and carries no extra input fields.

## @evidence contracts/development/implementation.md#efficient-algorithms

Copies a bounded number of scalar components per cue.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Separate mutable input and output ownership requires a fresh copy for every compiled cue.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only copied scalar fields in the result, with no reference to the source cue or its nested records.
