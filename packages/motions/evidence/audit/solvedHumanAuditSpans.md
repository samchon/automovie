# src/audit/solvedHumanAuditSpans.ts#solvedHumanAuditSpans

## @evidence contracts/development/common.md#meaningful-documentation

States what is superseded and why, the pieces, the bearing windows and what is still read.

## @evidence contracts/development/implementation.md#principled-implementation

The solver's causal ownership record (`IAutoMoviePhysicalOwnershipEvent`) says when and which segments it moves, and its contact receipts say what touched what, so the audit reads the contacts of the physics it shows.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Finds each window's owned span and parts, then splits and rewrites the overlapping actions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only plants of parts the solver owns are replaced, and only inside the span it owns them; nothing is removed outside a solved window.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(W * (E + R + S * C)) for W windows, E ownership events, R receipts and S actions of C contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh spans; retains nothing.
