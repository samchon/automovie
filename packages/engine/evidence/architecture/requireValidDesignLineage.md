# src/architecture/requireValidDesignLineage.ts#requireValidDesignLineage

## @evidence contracts/development/implementation.md#principled-implementation

Delegates every rule to `validateDesignLineage` and turns its first violation into one thrown message, so a query's premises are exactly the validator's guarantees.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One guard shared by the compare, decision, digest, impact, phase-order and phase-snapshot queries, which each kept a private copy of the same message.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no lineage and relaxes no rule; an invalid record is refused rather than repaired or partly answered.

## @evidence contracts/development/common.md#meaningful-documentation

States why queries call it first, what the thrown message names, and that a valid lineage returns nothing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Pays the complete `validateDesignLineage` cost, including repeated prerequisite reachability walks, lifecycle checks and decision-by-artifact comparisons; those terms can be superlinear. Adds only first-finding message formatting.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Validates the record it is handed each call, because the record is the caller's mutable data; a caller answering many questions about one lineage validates once and uses the unvalidated cores such as `compareDesignVariants`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the validation result is dropped on return.
