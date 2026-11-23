# src/architecture/designLineageRecord.ts#designLineageRecord

## @evidence contracts/development/implementation.md#principled-implementation

Length-prefixed encoding is injective: a reader that knows each field's length can split the line uniquely, so distinct field lists always give distinct lines and the digest over them cannot collide by concatenation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One encoder shared by the lineage digest, the view digest and the variant comparison key, which each kept a private copy that had to stay identical.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Escapes nothing and special-cases no character; the length prefix makes every character safe.

## @evidence contracts/development/common.md#meaningful-documentation

States the exact format, the unit of the length, and why authored separators cannot forge a boundary.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the total field length, one map and one join.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure encoder of its arguments that coordinates no work across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned string.
