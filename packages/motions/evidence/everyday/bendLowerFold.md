# src/everyday/bendLowerFold.ts#bendLowerFold

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, on which pose and its unit.

## @evidence contracts/development/implementation.md#principled-implementation

The key lowered as `bendLower.lower` lowers it, resolved once, read by the audit's own pose reader for the trunk-thigh pairs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One key, one resolve, one pose reading.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The audit's model and references are the measure; no depth is authored.

## @evidence contracts/development/implementation.md#efficient-algorithms

Read once per solved key at plan time, never per instant.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `bendLower.lower` and `AutoMovieMotionHumanAuditTangle.pose`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
