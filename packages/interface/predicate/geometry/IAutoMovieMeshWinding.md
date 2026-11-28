# src/geometry/IAutoMovieMeshWinding.ts#IAutoMovieMeshWinding

## @evidence contracts/development/common.md#meaningful-documentation

Finite signed winding, surface contact and solidity for one finite XYZ query point in the triangle mesh's own metre frame.

## @evidence contracts/development/design.md#principled-representation

The query totals signed solid angles over kept triangles and evaluates surface contact against the same oriented triangle geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result keeps numerical winding, contact and the threshold decision separate. The reusable query owns its snapshot of admitted triangle coordinates.

# src/geometry/IAutoMovieMeshWinding.ts#IAutoMovieMeshWinding.winding

## @evidence contracts/development/common.md#meaningful-documentation

Signed sum of solid angles divided by four pi. Use the surface field to identify positions where solid-angle winding is discontinuous.

# src/geometry/IAutoMovieMeshWinding.ts#IAutoMovieMeshWinding.surface

## @evidence contracts/development/common.md#meaningful-documentation

True when a kept triangle's plane and edge tests accept the point, including its edges and corners. The plane slack uses 1e-9 of its doubled area.

# src/geometry/IAutoMovieMeshWinding.ts#IAutoMovieMeshWinding.inside

## @evidence contracts/development/common.md#meaningful-documentation

True when surface is false and the absolute winding number reaches 0.5. Inward and outward orientations both count toward solidity.
