# src/validation/readContinuityTolerances.ts#readContinuityTolerances

## @evidence contracts/development/implementation.md#principled-implementation

Default position/facing tolerance to0.05m/5deg and admit finite nonnegative values, with facing<=180.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shared owner validates tolerance before either pairwise or film comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Explicit bad values append errors and return null, rather than being silently replaced.

## @evidence contracts/development/common.md#meaningful-documentation

Defaults, units, inclusive boundaries and null refusal are documented.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two scalar checks plus a small record/fault allocation take constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both continuity entrypoints reuse this exact tolerance policy once per call.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the tolerance record or caller-owned faults escape; no snapshot state is retained.
