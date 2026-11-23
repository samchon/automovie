# src/geometry/sweep/IAutoMovieSurfacePoint.ts#IAutoMovieSurfacePoint

## @evidence contracts/development/design.md#principled-representation

A deferred model-metre position writer and optional dimensionless normal/metres-per-u probe preserve the point's frame; output capacity and update ordering are caller premises.

## @evidence contracts/development/design.md#minimal-and-owned-surface

rigAutoMovieSurfaceNetwork resolves node writers and probes once, and rigAutoMovieSurfaceCurve reads them for endpoint positions and tangent-plane projection.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A null probe means no sweep tangent-plane constraint; the mutable record also represents a pending sweep node until registry finalization replaces its throwing writer.

## @evidence contracts/development/common.md#meaningful-documentation

Defines model frame, units, pending-state failure, scalar output indexing and borrowed probe storage.
