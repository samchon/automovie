# src/geometry/IAutoMovieHeightRule.ts#IAutoMovieHeightRule

## @evidence contracts/development/design.md#principled-representation

surfaceHeightAt returns a constant, evaluates the authored plane or uses edge-clamped bilinear lattice interpolation. Continuity and sample reproduction describe the admitted mathematical rule; binary64 overflow, rounding and malformed-grid fallback remain numerical limits rather than universally exact output guarantees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three kinds in one discriminated union, from one number to a sampled lattice, cover level, tilted and relief ground without a mesh, and both the world terrain and the scene patch cite this one type instead of spelling their own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A query off the lattice clamps to edge samples rather than extrapolating relief nobody authored. Explicit world callers must establish the numeric/grid premises because the retired production validator no longer supplies them automatically.

## @evidence contracts/development/common.md#meaningful-documentation

Defines containing surfaces, the shared evaluator, separate footprint membership, validator domains, formulas, metre units, row-major lattice layout, clamping and derived-arithmetic limits.
