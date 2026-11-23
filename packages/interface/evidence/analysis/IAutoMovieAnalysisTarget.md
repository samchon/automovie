# src/analysis/IAutoMovieAnalysisTarget.ts#IAutoMovieAnalysisTarget

## @evidence contracts/development/design.md#principled-representation `assertAutoMovieAnalysisTargets` runs inside every solver's request check before computation, and `autoMovieAnalysisMetric` applies the first target with the metric's key only when its unit string equals the metric's unit.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Key, unit, value and direction are the whole requirement; no unit table or conversion layer exists, since exact string matching is the stated contract.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An inapplicable target is never silently passed: a unit mismatch and an unknown key each emit a named warning, and a metric judged against a mismatched target reads `untargeted` rather than `meets`.

## @evidence contracts/development/common.md#meaningful-documentation

States why the unit is declared, the two warning codes for inapplicable targets, the exact-string matching rule, and every condition that refuses a target list.
