# src/geometry/IAutoMovieEvaluateSupportSection.ts#IAutoMovieEvaluateSupportSection.IInput

## @evidence contracts/development/common.md#meaningful-documentation

One admitted set of oriented half-planes in a finite XZ metre chart.

## @evidence contracts/development/design.md#principled-representation

The evaluator enumerates feasible pair intersections and uses exact-sign fallback when a floating residual is uncertain. Exact tight incidence identifies coinciding boundary constraints.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The input carries only the inequality data and weak-direction threshold. The evaluator owns classification and polygon assembly.

# src/geometry/IAutoMovieEvaluateSupportSection.ts#IAutoMovieEvaluateSupportSection.IInput.normals

## @evidence contracts/development/common.md#meaningful-documentation

Ordered dense finite unit normal pairs around a bounded XZ chart.

# src/geometry/IAutoMovieEvaluateSupportSection.ts#IAutoMovieEvaluateSupportSection.IInput.offsets

## @evidence contracts/development/common.md#meaningful-documentation

One borrowed finite metre offset per corresponding normal for the inequality nx X plus nz Z at most h.

# src/geometry/IAutoMovieEvaluateSupportSection.ts#IAutoMovieEvaluateSupportSection.IInput.minimumDirectionSine

## @evidence contracts/development/common.md#meaningful-documentation

Finite threshold in (0, 1), in absolute determinant units for unit directions. A feasible tight pair below this threshold refuses.

# src/geometry/IAutoMovieEvaluateSupportSection.ts#IAutoMovieEvaluateSupportSection.IResult

## @evidence contracts/development/common.md#meaningful-documentation

New mutable polygon of feasible corners in counterclockwise XZ order, with implicit closure.

## @evidence contracts/development/design.md#principled-representation

The evaluator deduplicates corners by tight-plane set, sorts by angle around the mean point and checks positive representable area.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The polygon owns corner coordinates and identifying plane ordinals. The caller retains the original normals and offsets.
