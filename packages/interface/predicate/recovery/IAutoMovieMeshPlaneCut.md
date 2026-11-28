# src/recovery/IAutoMovieMeshPlaneCut.ts#IAutoMovieMeshPlaneCut.Operation

## @evidence contracts/development/common.md#meaningful-documentation

The one-shot operation reports source cut observations with original point incidence and can restrict the source through an original-face predicate.

## @evidence contracts/development/design.md#principled-representation

Signed scalar distances determine boundary contact and interpolation. Coplanar patch boundaries and unresolved branches retain their own contour observations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller supplies immutable geometry and plane. The cutter owns only raw intersection graph evidence; later fitting owns coefficients.

# src/recovery/IAutoMovieMeshPlaneCut.ts#IAutoMovieMeshPlaneCut.Prepare

## @evidence contracts/development/common.md#meaningful-documentation

The preparation specifies connected source address spaces, optional provenance modes and per-plane candidate and filter controls.

## @evidence contracts/development/design.md#principled-representation

A supplied strictly ordered candidate list represents every source face containing the queried height. Prepared queries use the same signed heights and exact original face IDs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Preparation borrows source and scalar arrays. Each query owns its observed contours and optional provenance, separate from any fitted coefficients.
