# src/recovery/mesh/IAutoMovieRecoverySectionReport.ts#IAutoMovieRecoverySectionReport

## @evidence contracts/development/design.md#principled-representation

Each report retains its slicing coordinate and separates closed-loop diagnostics from open fitted arcs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Closed-loop coefficients belong to the enclosing loft; only their fit diagnostics are repeated here.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Open arcs and isolated contacts remain observations rather than silently closed surface boundaries.

## @evidence contracts/development/common.md#meaningful-documentation

Members document physical units, ownership and optional-state meaning.
