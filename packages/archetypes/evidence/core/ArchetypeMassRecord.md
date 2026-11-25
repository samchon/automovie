# src/core/ArchetypeMassRecord.ts#ArchetypeMassRecord.mass

## @evidence contracts/development/common.md#meaningful-documentation

States SI units and the finite positive requirement.

## @evidence contracts/development/implementation.md#principled-implementation

Positive finite body mass is the existing body contract; no division or tensor computation proceeds on an unsupported total.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One predicate and refusal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No cap or default body mass.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant scalar admission.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One predicate serves all mass-property consumers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

No retained state or resource.

# src/core/ArchetypeMassRecord.ts#ArchetypeMassRecord.admit

## @evidence contracts/development/common.md#meaningful-documentation

States the checked components and the remaining tensor-consistency premise.

## @evidence contracts/development/implementation.md#principled-implementation

Requires positive finite mass, finite centre and all six tensor entries, and nonnegative diagonal moments. A physically consistent tensor and unit rigid placement remain the author/caller's premise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared mass admission followed by fixed-component record checks.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No guessed centre, zero tensor replacement or tolerance changes a record.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Fixed-size record admission.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

combine, about and finish share this exact boundary.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

No retained input or allocation beyond temporary scalar values.

# src/core/ArchetypeMassRecord.ts#ArchetypeMassRecord.finish

## @evidence contracts/development/common.md#meaningful-documentation

States units, complete reduction ownership and final admission.

## @evidence contracts/development/implementation.md#principled-implementation

ArchetypeMassArithmetic.sum preserves ordinary accumulation and exactly resolves exceptional cancellation/overflow midpoint; admission applies to the finished six-component record rather than a partial sum.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Six shared reductions, one record construction and one admission.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No partial component is capped or silently replaced, and no computed infinity escapes as a body record.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in contribution count across six axes, plus sum's exceptional bounded-width arithmetic.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

of and combine use the same final reductions and admission.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only scalar output records escape; no contribution array is retained.
