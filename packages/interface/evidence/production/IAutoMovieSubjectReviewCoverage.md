# src/production/IAutoMovieSubjectReviewCoverage.ts#IAutoMovieSubjectReviewCoverage

## @evidence contracts/development/design.md#principled-representation

Coverage classifies subject-view receipts by viewpoint and supplied revision, compile, plan and capture-runtime identity strings, then projects observed, missing and stale ids in plan order; it does not derive those identities from the nested runtime or artifact bytes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Separate planned, observed, stale, unplanned and foreign populations expose why coverage is incomplete, while one state ladder summarizes the result without hiding duplicates.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Empty plans are indeterminate rather than reviewed; frame evidence, malformed records and other subjects are foreign, and stale or unplanned views cannot discharge required current viewpoints.

## @evidence contracts/development/common.md#meaningful-documentation

Defines the state and each population's current-versus-stale meaning, plan order, foreign count and redundant current records.
