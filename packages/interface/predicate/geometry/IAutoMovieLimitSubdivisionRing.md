# src/geometry/IAutoMovieLimitSubdivisionRing.ts#IAutoMovieLimitSubdivisionRing.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The result documents limit position, per-sector normals, fan order and the documented approximation masks for sectors with special tangent behavior.

## @evidence contracts/development/design.md#principled-representation

The ring kernel selects smooth, dart, crease or corner rules from the stable sharp edges. It orients the normal with ring winding and refuses a vanishing computed normal. Approximate sector masks are used at the documented configurations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The ring result returns only one point, per-sector normals and local sector IDs. Level aggregation owns global normal indexing.

# src/geometry/IAutoMovieLimitSubdivisionRing.ts#IAutoMovieLimitSubdivisionRing.IResult.position

## @evidence contracts/development/common.md#meaningful-documentation

The new XYZ value uses the ring's metre frame. A corner with at least three sharp edges retains its centre coordinates.

# src/geometry/IAutoMovieLimitSubdivisionRing.ts#IAutoMovieLimitSubdivisionRing.IResult.normals

## @evidence contracts/development/common.md#meaningful-documentation

Each new unit XYZ vector corresponds to one sharp-edge sector or to the whole smooth/dart fan.

# src/geometry/IAutoMovieLimitSubdivisionRing.ts#IAutoMovieLimitSubdivisionRing.IResult.sectors

## @evidence contracts/development/common.md#meaningful-documentation

Each fan-face ordinal maps to a local normal index and all values are zero for smooth and dart fans.
