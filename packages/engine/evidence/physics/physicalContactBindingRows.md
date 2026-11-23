# src/physics/physicalContactBindingRows.ts#physicalContactBindingRows

## @evidence contracts/development/common.md#meaningful-documentation

Describes which pose owns each endpoint in a single-body fit.

## @evidence contracts/development/implementation.md#principled-implementation

Sends the source profile and actual receiver reads to the common relationship owner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One resolver selects the two admitted pose readers during preparation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The external endpoint keeps the actual snapshot and contributes no candidate key.

## @evidence contracts/development/implementation.md#efficient-algorithms

Resolves each row's endpoint reads once, before numerical probes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the shared relationship row owner for both single-body and coupled fits.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Pose reader closures live with their prepared rows.
