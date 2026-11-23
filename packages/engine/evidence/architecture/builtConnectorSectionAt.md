# src/architecture/builtConnectorSectionAt.ts#builtConnectorSectionAt

## @evidence contracts/development/implementation.md#principled-implementation

Resolves the connector, checks the closed unit fraction interval and delegates to `builtConnectorSection`'s binary64 piecewise-linear interpolation. Sorted bracketing stations and finite computed differences are caller premises; the section helper does not make this an exact-arithmetic interpolation certificate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The id-addressed form owns exactly the lookup and the two refusals, and the record-addressed form owns the interpolation, so the rule is written once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no connector; a fraction outside `[0, 1]` and a connector without a section are refused by name instead of clamped or given a default section.

## @evidence contracts/development/common.md#meaningful-documentation

States the constant and varying readings, the even narrowing between stations, the metre units, and all three throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the connector count for the lookup plus the station count for the bracket scan.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Answers one fraction per call over the caller's mutable record and caches nothing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; the caller owns the returned section.
