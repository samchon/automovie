# src/geometry/IAutoMovieSurfacePoint.ts#IAutoMovieSurfacePoint

## @evidence contracts/development/common.md#meaningful-documentation

The declaration describes a pose-dependent writer and optional tangent-plane probe. The writer documents model metres, the caller's three scalar slots and required registry finalization.

## @evidence contracts/development/design.md#principled-representation

The network creates points with writers drawn from authored nodes or sweep samples. It finalizes pending sweep bindings before use. The curve rig reads endpoint writers and consults the probe for tangent-plane constraints.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only pose writing and the optional probe are exposed. The vertex registry owns identities and the curve rig owns its transport and tangent adjustment.

# src/geometry/IAutoMovieSurfacePoint.ts#IAutoMovieSurfacePoint.ISweepProbe

## @evidence contracts/development/common.md#meaningful-documentation

The named record identifies the borrowed rig and the six-scalar layout of its slot. The derivative uses model metres per normalized U.

## @evidence contracts/development/design.md#principled-representation

The surface rig registers the slot. During curve updates, `rigSurfaceCurve` multiplies `slot` by six and reads the first three scalars as the normal for its endpoint projection.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The probe refers to an existing borrowed rig buffer rather than exporting a fresh vector for each point. The producer and consumer share the ownership and slot layout.

# src/geometry/IAutoMovieSurfacePoint.ts#IAutoMovieSurfacePoint.write

## @evidence contracts/development/common.md#meaningful-documentation

Documents the borrowed writable buffer and scalar offset. Curve updates call the registered writer directly at an endpoint's model-metre XYZ position.

# src/geometry/IAutoMovieSurfacePoint.ts#IAutoMovieSurfacePoint.probe

## @evidence contracts/development/common.md#meaningful-documentation

Identifies when the point carries a sweep tangent plane. Flat or independent endpoints can have a null probe.

# src/geometry/IAutoMovieSurfacePoint.ts#IAutoMovieSurfacePoint.ISweepProbe.rig

## @evidence contracts/development/common.md#meaningful-documentation

Documents the shared rig whose probe storage is read by the downstream curve after sweep refresh.

# src/geometry/IAutoMovieSurfacePoint.ts#IAutoMovieSurfacePoint.ISweepProbe.slot

## @evidence contracts/development/common.md#meaningful-documentation

Documents the probe ordinal and its normal and derivative layout. Curve preparation uses this ordinal to find the endpoint normal.
