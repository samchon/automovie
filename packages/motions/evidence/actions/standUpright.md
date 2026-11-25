# src/actions/standUpright.ts#standUpright

## @evidence contracts/development/common.md#meaningful-documentation

States the per-body alignment; the namespace documents its physical targets and search bounds.

## @evidence contracts/development/implementation.md#principled-implementation

The plumb-line trunk by Brent's minimisation (`bracketedMinimum`), the neck and level head by bracketed roots (`bracketedCrossing`), and the lean from measured hip-to-ankle separation and the rig's joint midpoints, with FK requested only for each residual's measured bones.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One read of the body's own property.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every bound and tolerance is a named constant with its derivation; no body-specific angle is chosen.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One property read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The body's record solves the alignment once (`align`) and every reader shares it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The alignment is owned by the body's record; this reader retains nothing.

# src/actions/standUpright.ts#standUpright.align

## @evidence contracts/development/common.md#meaningful-documentation

States what is solved and who reads it.

## @evidence contracts/development/implementation.md#principled-implementation

The plumb-line trunk by Brent's minimisation (`bracketedMinimum`), the neck and level head by bracketed roots (`bracketedCrossing`), and the lean from measured hip-to-ankle separation and the rig's joint midpoints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One synchronous search whose single caller is the body's record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every bound and tolerance is a named constant with its derivation; no body-specific angle is chosen.

## @evidence contracts/development/implementation.md#efficient-algorithms

Residuals visit requested ancestry instead of every bone and prepare each of the three fixed name demands once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One search shares the engine's dependency reader across candidates.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader, three bounded name readers and the per-candidate necks end with the search's return or throw.
