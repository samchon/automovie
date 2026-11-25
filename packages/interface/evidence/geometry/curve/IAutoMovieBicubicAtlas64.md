# src/geometry/curve/IAutoMovieBicubicAtlas64.ts#IAutoMovieBicubicAtlas64.Patch

## @evidence contracts/development/design.md#principled-representation

Sixteen row-major control IDs address millimetre coefficients on normalized u,v; AutoMovieBicubicAtlasPlan64 checks length, safe indices and unique nonempty IDs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Atlas input and every planning/emission stage share this chart identity and coefficient addressing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shared integer IDs declare coefficient identity; equal coordinates do not infer a join.

## @evidence contracts/development/common.md#meaningful-documentation

States registry scope, row order and the runtime admission owner.

# src/geometry/curve/IAutoMovieBicubicAtlas64.ts#IAutoMovieBicubicAtlas64.Counts

## @evidence contracts/development/design.md#principled-representation

Counts distinguish first-seen cells, new render indices and retained triangles; the maximum Taylor estimate uses millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieBicubicAtlasEmit64 updates these values alongside geometry and diagnostic qualification.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Coarse retention, zero-area omission and zero normals remain separately observable rather than credited as qualified output.

## @evidence contracts/development/common.md#meaningful-documentation

Defines continuation across chunks, finite-area failures and numerical estimate scope.

# src/geometry/curve/IAutoMovieBicubicAtlas64.ts#IAutoMovieBicubicAtlas64.Range

## @evidence contracts/development/design.md#principled-representation

Original normalized patch bounds identify a retained cell; triangleStart counts current-chunk triangle triples and the error estimate uses millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The atlas emitter publishes each range beside global indices to retain analytic patch attribution across streaming boundaries.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A zero-triangle range can report omitted collapsed candidates, and over-tolerance coarse estimates are not hidden.

## @evidence contracts/development/common.md#meaningful-documentation

Defines patch ownership, chunk offsets, parameter bounds and approximation limitations.

# src/geometry/curve/IAutoMovieBicubicAtlas64.ts#IAutoMovieBicubicAtlas64.Cell

## @evidence contracts/development/design.md#principled-representation

Bounds address the original unit-square patch while the restricted millimetre grid is parameterized on its own unit square.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Atlas planning owns subdivision and emission reads these leaves to build conforming boundaries and error attribution.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Binary64 derivative-control estimates are not outward-rounded certificates; retain-coarse leaves may explicitly exceed tolerance.

## @evidence contracts/development/common.md#meaningful-documentation

Defines grid restriction, row order, estimate units and original parameter bounds.

# src/geometry/curve/IAutoMovieBicubicAtlas64.ts#IAutoMovieBicubicAtlas64.Plan

## @evidence contracts/development/design.md#principled-representation

The root grid remains available even when conflicts or budgets leave no cells; diagnostics distinguish omission from over-tolerance retention.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieBicubicAtlasPlan64 produces one record per input patch for registry construction and analytic vertex evaluation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Empty retained work is not repaired by a proxy patch; conflicting coefficients remain an explicit limitation.

## @evidence contracts/development/common.md#meaningful-documentation

States grid retention, storage sharing and partial-plan diagnostics.

# src/geometry/curve/IAutoMovieBicubicAtlas64.ts#IAutoMovieBicubicAtlas64.Binding

## @evidence contracts/development/design.md#principled-representation

Indexed extraction preserves directed normalized authority endpoints and the independent normal-fan identity of the canonical binding owner.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Registry and vertex stages reuse the preparation map's value contract without declaring another binding shape.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Extraction does not widen authority data or erase the optional transported legacy fan distinction.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the preparation owner and the preserved interval and fan semantics.

# src/geometry/curve/IAutoMovieBicubicAtlas64.ts#IAutoMovieBicubicAtlas64.Occurrence

## @evidence contracts/development/design.md#principled-representation

Input patch ordinals and side ordinals identify a chart use; exact canonical keys map to original normalized local samples.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieBicubicAtlasRegistry64 creates occurrences for edge-phase transport and vertex ownership during emission.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An absent binding selects existing four-ID identity rather than inventing a canonical authority from positions.

## @evidence contracts/development/common.md#meaningful-documentation

States index domains, orientation, request-map ownership and absent-binding behavior.

# src/geometry/curve/IAutoMovieBicubicAtlas64.ts#IAutoMovieBicubicAtlas64.Vertex

## @evidence contracts/development/design.md#principled-representation

The append-only safe integer index includes vertexOffset while Cartesian position is converted from model millimetres to model metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Local, corner, edge and normal-fan caches reuse this receipt for indices and triangle area arithmetic.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Receipt reuse follows declared boundary/fan identity rather than coordinate welding.

## @evidence contracts/development/common.md#meaningful-documentation

States global indexing, position frame and shared receipt lifetime.

# src/geometry/curve/IAutoMovieBicubicAtlas64.ts#IAutoMovieBicubicAtlas64.Sample

## @evidence contracts/development/design.md#principled-representation

Unit-square coordinates locate the patch while an optional exact phase distinguishes canonical addresses with coincident rounded coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The emitter passes samples through parameter triangulation to the vertex owner, preserving boundary side and phase attribution.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional side and phase refine a local request; absence allows the vertex owner to recover boundary ownership from its registry rather than assuming an interior point.

## @evidence contracts/development/common.md#meaningful-documentation

Defines local coordinates, optional exact identity and side inference.

# src/geometry/curve/IAutoMovieBicubicAtlas64.ts#IAutoMovieBicubicAtlas64.Edge

## @evidence contracts/development/design.md#principled-representation

Declared authority or ordered control IDs determine identity; exact dyadic samples remain distinct despite rounded numeric collisions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Registry construction collects incidents once and emission reuses their union of requests and first legacy owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Neither shared identity nor finite incidence certifies manifoldness, orientation or embedding.

## @evidence contracts/development/common.md#meaningful-documentation

Defines canonical keys, exact sample ordering and last-use legacy cache release.

# src/geometry/curve/IAutoMovieBicubicAtlas64.ts#IAutoMovieBicubicAtlas64.Corner

## @evidence contracts/development/design.md#principled-representation

First-owner unit-corner coordinates select analytic normals while the shared coefficient supplies model-millimetre position.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The atlas registry and vertex owner use one corner record for deterministic ownership and last-use release.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Control equivalence declares corner sharing; equal coordinates alone create no corner relation.

## @evidence contracts/development/common.md#meaningful-documentation

States grid aliasing, first-owner choice, optional receipt and release boundary.
