# src/film/admitMotionTake.ts#admitMotionTake

## @evidence contracts/development/common.md#meaningful-documentation

Defines the JSON input and borrowed output, accepted schema, ordered admission and relationship to provenance verification.

## @evidence contracts/development/implementation.md#principled-implementation

Checks the version and discriminator before the version-specific shape. Validates every record's exact field set, syntax, numeric bounds and ledger uniqueness before treating parsed values as the contract type.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Separates JSON admission from reconciliation with runtime facts; private validators check recurring scalar and record shapes in one place.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rejects extra fields and duplicate keys instead of silently ignoring them, and requires proof that the registered source module is covered by the input ledger.

## @evidence contracts/development/implementation.md#efficient-algorithms

A linear pass over the supplied ledger records and text; each key is inserted in a set once and the source key is looked up once.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Performs one admission pass for a parsed artifact and keeps no results between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Owns only temporary key sets during admission and returns the caller's parsed data.
