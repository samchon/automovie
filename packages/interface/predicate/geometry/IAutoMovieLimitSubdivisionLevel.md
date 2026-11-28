# src/geometry/IAutoMovieLimitSubdivisionLevel.ts#IAutoMovieLimitSubdivisionLevel.IResult

## @evidence contracts/development/common.md#meaningful-documentation

The result explains local metre positions, packed unit normals and sector addressing per original level corner.

## @evidence contracts/development/design.md#principled-representation

The evaluator refines the level's parent points, walks each child's local quad ring until remaining semi-sharpness is spent, then offsets local sector indices into the shared normal pool.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The return owns three fresh evaluated buffers. It reuses admitted topology and leaves render vertex repacking to its consumer.

# src/geometry/IAutoMovieLimitSubdivisionLevel.ts#IAutoMovieLimitSubdivisionLevel.IResult.positions

## @evidence contracts/development/common.md#meaningful-documentation

One new XYZ metre triple aligns to every input topology vertex in its original order.

# src/geometry/IAutoMovieLimitSubdivisionLevel.ts#IAutoMovieLimitSubdivisionLevel.IResult.normals

## @evidence contracts/development/common.md#meaningful-documentation

Unit XYZ normals are numbered by vertex then by sector along the vertex fan.

# src/geometry/IAutoMovieLimitSubdivisionLevel.ts#IAutoMovieLimitSubdivisionLevel.IResult.cornerNormals

## @evidence contracts/development/common.md#meaningful-documentation

Each zero-based index addresses the normal of the input corner's sector in the shared normal pool.
