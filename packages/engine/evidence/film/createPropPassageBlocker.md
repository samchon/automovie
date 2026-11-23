# src/film/createPropPassageBlocker.ts#createPropPassageBlocker

## @evidence contracts/development/implementation.md#principled-implementation

Measures rest-pose opening fill vertices through shared world matrices and bounds each connector segment by its maximal piecewise-linear section dimensions; endpoint and interior station extrema give an outer bound, while propBoundsOverlap uses strict interiors so contact alone never blocks. Missing or cyclic fill placement and unspecified connector sections remain unmeasurable rather than guessed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Separates invariant environment measurement from prop-dependent overlap because validatePropPlacementGeometry checks many props against one environment; propBlockedPassages delegates the same preparation for a single query, preserving one measurement owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every measurable passage uses the same bounds and overlap law; no prop or fixture changes geometry, and declaration order and first-match element/model lookup semantics remain explicit when malformed duplicate ids reach this query.

## @evidence contracts/development/common.md#meaningful-documentation

States opening and connector measurement, conservative corridor bounds, strict-contact behavior, result order, omitted unmeasurable cases and the unchanged-environment lifetime premise of the retained query.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation indexes elements/models and delegates rest-matrix composition and opening-vertex measurement. Each connector segment filters section stations; each endpoint/station section lookup scans the section table. Each prop query scans all prepared opening/segment boxes plus its output, avoiding repeated preparation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The closure shares prepared bounds across queries over the exact same immutable-for-the-call environment; the validator keys queries by environment object identity and drops its map after validation. Changes require new preparation; there is no global cache or identity-only invalidation assumption.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Preparation's element/model/rest indexes are released before returning; the query retains one bound per measurable opening and connector route segment until its caller drops the closure. Blockage arrays are fresh caller-owned results; no handles or tasks are acquired.
