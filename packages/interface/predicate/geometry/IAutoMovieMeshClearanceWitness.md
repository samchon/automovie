# src/geometry/IAutoMovieMeshClearanceWitness.ts#IAutoMovieMeshClearanceWitness

## @evidence contracts/development/common.md#meaningful-documentation

The record ties an already-clear or violating overlap point to original triangles and three independently owned front coefficients.

## @evidence contracts/development/design.md#principled-representation

The measurement clips each overlapping projected triangle pair and delivers one witness per clipped vertex. The displacement solver uses the original weights directly in its inequality.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The witness supplies exactly the source metadata and local signed gap needed by the solver and inspection marks. It does not retain either resident mesh.

# src/geometry/IAutoMovieMeshClearanceWitness.ts#IAutoMovieMeshClearanceWitness.triangle

## @evidence contracts/development/common.md#meaningful-documentation

The value identifies the original front triangle before spatial ordering.

# src/geometry/IAutoMovieMeshClearanceWitness.ts#IAutoMovieMeshClearanceWitness.backTriangle

## @evidence contracts/development/common.md#meaningful-documentation

The value identifies the original back triangle that contributed the projected-overlap witness.

# src/geometry/IAutoMovieMeshClearanceWitness.ts#IAutoMovieMeshClearanceWitness.vertices

## @evidence contracts/development/common.md#meaningful-documentation

The copied vector lists the front triangle's three original vertex ordinals in barycentric order.

# src/geometry/IAutoMovieMeshClearanceWitness.ts#IAutoMovieMeshClearanceWitness.weights

## @evidence contracts/development/common.md#meaningful-documentation

The caller-owned barycentric vector aligns with vertices and preserves small negative roundoff from projection.

# src/geometry/IAutoMovieMeshClearanceWitness.ts#IAutoMovieMeshClearanceWitness.gap

## @evidence contracts/development/common.md#meaningful-documentation

The signed metre value is front minus back depth, with zero at contact and negative when order reverses.
