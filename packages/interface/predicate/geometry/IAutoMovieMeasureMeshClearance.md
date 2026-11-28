# src/geometry/IAutoMovieMeasureMeshClearance.ts#IAutoMovieMeasureMeshClearance.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The list describes original front ordinals, signed metres, axis order, skipped projections, and the independent witness callback.

## @evidence contracts/development/design.md#principled-representation

Projection and clipping visit every relevant overlapping back triangle and reduce finite depth differences to one minimum per observed front face.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The returned list retains only per-face minima. The optional visitor receives individual constraints separately.

# src/geometry/IAutoMovieMeasureMeshClearance.ts#IAutoMovieMeasureMeshClearance.ITriangleClearance

## @evidence contracts/development/common.md#meaningful-documentation

The entry names the original front triangle and the meaning and unit of its signed minimum.

## @evidence contracts/development/design.md#principled-representation

The emitter traverses original front ordinals and adds a measurement only when at least one overlap produced a finite separation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The item carries a face identity and one measurement. Mesh storage and optional overlap witnesses remain at the call boundary.

# src/geometry/IAutoMovieMeasureMeshClearance.ts#IAutoMovieMeasureMeshClearance.ITriangleClearance.triangle

## @evidence contracts/development/common.md#meaningful-documentation

The ordinal identifies a front face in the original mesh and explains omission for no projected overlap.

# src/geometry/IAutoMovieMeasureMeshClearance.ts#IAutoMovieMeasureMeshClearance.ITriangleClearance.minimum

## @evidence contracts/development/common.md#meaningful-documentation

The signed front-minus-back depth uses metres, with zero at contact and a negative value for reversed order.
