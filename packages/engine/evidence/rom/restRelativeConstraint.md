# src/rom/restRelativeConstraint.ts#restRelativeConstraint

## @evidence contracts/development/implementation.md#principled-implementation

Invert sign/neutral on clinical interval endpoints and reorder mirrored bounds, retaining swingDeg as the existing rest-relative deviation-cap policy.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Interval conversion shares scalar frame meaning while preserving null axes and absent-frame range identity.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid frame sign/neutral throws; unchanged swingDeg does not prove clinical two-axis metric invariance under arbitrary neutral shifts.

## @evidence contracts/development/common.md#meaningful-documentation

Docs identify degrees, endpoint ordering, null/undefined semantics and the cone policy without universal invariance claims.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three fixed axis conversions allocate at most three intervals plus one constraint wrapper.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Unchanged ranges/frames remain borrowed; changed bounds or rest convention requires new conversion.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns wrapper/new intervals and borrows unchanged clinical ranges; no registry, handle or task survives.
