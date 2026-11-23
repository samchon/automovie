# src/production/IAutoMovieProductionAcousticResponse.ts#IAutoMovieProductionAcousticResponse

## @evidence contracts/development/design.md#principled-representation

The engine classifies outdoor, same-room and cross-room paths from explicit bindings, then uses the selected Sabine-derived response and exact input revision to produce room energy metrics or transmission amplitude gain.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Available results retain profile and input identity with path-specific nullable metrics; unsupported and not-run results carry the classification and actionable reason without pretending to contain a response.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Incomplete indoor/outdoor binding is unsupported, missing analysis input is not-run, and adopted responses remain not-run until bytes are decoded and mapped; no guessed room response replaces those gaps.

## @evidence contracts/development/common.md#meaningful-documentation

Defines path classes, revision binding, seconds and energy versus amplitude metrics, path-dependent nulls and unavailable-response reasons.
