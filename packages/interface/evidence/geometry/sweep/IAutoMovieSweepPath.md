# src/geometry/sweep/IAutoMovieSweepPath.ts#IAutoMovieSweepPath

## @evidence contracts/development/design.md#principled-representation

The three queries a sweep needs from its path, position, tangent and transported frame, behind one compiled record so the transport is computed once.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A record of closures over the compiled path, owned by the sweep that compiled it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Queries outside the path clamp to its ends rather than extrapolating a curve the spine never declared.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, the parameter's meaning and range, and each query's unit.
