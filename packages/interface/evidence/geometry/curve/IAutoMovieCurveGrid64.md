# src/geometry/curve/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.Input

## @evidence contracts/development/design.md#principled-representation

Ordered complete cubic courses and an optional explicit station period define a tensor family without sampled through-point substitution.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Sampling policy, topology identity and curve data remain explicit input properties.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Equal contact coordinates do not declare a shared physical vertex; the caller assigns a unique instance domain.

## @evidence contracts/development/common.md#meaningful-documentation

States normalized course units, station units, metre output and the distinction between requested spacing and an error bound.

# src/geometry/curve/IAutoMovieCurveGrid64.ts#IAutoMovieCurveGrid64.Result

## @evidence contracts/development/design.md#principled-representation

Mesh buffers and construction are generated from the same tensor coefficient representation, with distinct numeric diagnostics.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One result carries the reusable mesh and the actual construction needed for inspection.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Counts and degenerate-face diagnostics do not imply visual, topology or anatomical acceptance.

## @evidence contracts/development/common.md#meaningful-documentation

States metre positions, geometric normals and explicit mathematical limits.
