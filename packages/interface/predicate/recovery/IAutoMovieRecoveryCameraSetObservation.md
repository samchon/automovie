# src/recovery/IAutoMovieRecoveryCameraSetObservation.ts#IAutoMovieRecoveryCameraSetObservation

## @evidence contracts/development/common.md#meaningful-documentation

Features remain source-indexed, pair records preserve both search directions, and descriptor work records the actual directional traversal count.

## @evidence contracts/development/design.md#principled-representation

Each view contributes one feature population. Each unordered pair carries forward and reverse searches in deterministic index order. A direction with too few target descriptors contributes no comparisons.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Observation owns completed features and directional match work. Track linkage and geometric registration consume these records and issue their own qualification.

# src/recovery/IAutoMovieRecoveryCameraSetObservation.ts#IAutoMovieRecoveryCameraSetObservation.features

## @evidence contracts/development/common.md#meaningful-documentation

The coordinator completes one extraction per view and reuses those arrays for each pair.

# src/recovery/IAutoMovieRecoveryCameraSetObservation.ts#IAutoMovieRecoveryCameraSetObservation.pairs

## @evidence contracts/development/common.md#meaningful-documentation

Pairs are enumerated with the lower source index first, preserving entries even if either direction has no work.

# src/recovery/IAutoMovieRecoveryCameraSetObservation.ts#IAutoMovieRecoveryCameraSetObservation.descriptorComparisons

## @evidence contracts/development/common.md#meaningful-documentation

Each working direction contributes source count times target count. The preflight and matcher share the same two-target eligibility rule.
