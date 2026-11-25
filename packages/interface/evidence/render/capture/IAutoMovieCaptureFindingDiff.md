# src/render/capture/IAutoMovieCaptureFindingDiff.ts#IAutoMovieCaptureFindingDiff

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, the identity of a finding, how its severity and intervals are read from a round's episodes, the outcome rule, and when and how the diff is omitted.

## @evidence contracts/development/design.md#principled-representation

A compared diff and an omitted one are union members keyed by `state`, so a record without diagnostics never reads as an unchanged round.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written by `diffAutoMovieCaptureFindings` into the comparison and read by the record, the CLI and the correction-round rule; it reuses the reducer's observation type instead of a parallel record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

`lacking` names each record without diagnostics rather than collapsing them into a flag.

# src/render/capture/IAutoMovieCaptureFindingDiff.ts#IAutoMovieCaptureFindingDiff.Cause

## @evidence contracts/development/common.md#meaningful-documentation

States which round's coverage each cause reports and when `not-sampled` applies.

## @evidence contracts/development/design.md#principled-representation

The three open coverage statuses and a sampling gap express why a required interval could not support a comparison.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A closed literal union read only by unmatched entries.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A deferred or unsampled interval prevents a fix or a severity comparison where checked coverage is required.

# src/render/capture/IAutoMovieCaptureFindingDiff.ts#IAutoMovieCaptureFindingDiff.IEntry

## @evidence contracts/development/common.md#meaningful-documentation

States each state's condition, which observations it carries, what `change` compares and what a legacy unmatched entry can omit.

## @evidence contracts/development/design.md#principled-representation

Fixed, new, carried and unmatched identities are union members keyed by `state`. The carried entry requires mutually checked coverage and carries its change. The unmatched entry carries its cause, any uncovered film intervals and the available worst witnesses.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The identity plus the worst observation of each round. Unmatched entries published by Render also retain the closed intervals needed to scope another observation. The intervals reuse the diagnostic film clock across capture schedules.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A missing observation is null. An older comparison whose affected intervals are absent cannot establish that a different selection is clear of its unmatched error.

# src/render/capture/IAutoMovieCaptureFindingDiff.ts#IAutoMovieCaptureFindingDiff.IIdentity

## @evidence contracts/development/common.md#meaningful-documentation

Names each identity field and when the category is an error.

## @evidence contracts/development/design.md#principled-representation

The five fields the inspection packet holds once per sample within a scope, plus the category the outcome reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shared by every entry state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The category is an error when either round saw one, so a change of category cannot hide an error from the outcome.
