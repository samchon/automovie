# src/geometry/sweep/IAutoMovieSweepTransport.ts#IAutoMovieSweepTransport

## @evidence contracts/development/design.md#principled-representation

Inputs, compiled tables and queries of one spine in caller-visible typed arrays, the standard form of an allocation-free per-frame evaluator.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three input arrays, one recompile and four queries; everything the spine computes lives behind them.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Queries before a successful `update` read stale or zero tables; `update` refuses invalid input, as `frameAutoMovieSweepSpine` documents.

## @evidence contracts/development/common.md#meaningful-documentation

States the call order, the output layout and why the buffers exist.
