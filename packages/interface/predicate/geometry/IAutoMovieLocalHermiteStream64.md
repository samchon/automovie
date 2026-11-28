# src/geometry/IAutoMovieLocalHermiteStream64.ts#IAutoMovieLocalHermiteStream64.Chunk.construction

## @evidence contracts/development/common.md#meaningful-documentation

The field identifies emitted station construction in model metres and links to the open-course topology and copied samples.

# src/geometry/IAutoMovieLocalHermiteStream64.ts#IAutoMovieLocalHermiteStream64.IConstructionCourse

## @evidence contracts/development/common.md#meaningful-documentation

The record states the retained source identifier, open topology, and ordering and units of copied points.

## @evidence contracts/development/design.md#principled-representation

The streaming tessellator builds construction from emitted station boundaries and copies positions in course order. The literal false keeps the open course topology visible in the emitted record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The construction line carries a source course name and a polyline. Global vertex indices and face ranges belong to the containing chunk.

# src/geometry/IAutoMovieLocalHermiteStream64.ts#IAutoMovieLocalHermiteStream64.IConstructionCourse.id

## @evidence contracts/development/common.md#meaningful-documentation

The name preserves the saved course identifier at the station.

# src/geometry/IAutoMovieLocalHermiteStream64.ts#IAutoMovieLocalHermiteStream64.IConstructionCourse.closed

## @evidence contracts/development/common.md#meaningful-documentation

The field preserves the admitted open-course topology as the literal false.

# src/geometry/IAutoMovieLocalHermiteStream64.ts#IAutoMovieLocalHermiteStream64.IConstructionCourse.points

## @evidence contracts/development/common.md#meaningful-documentation

The sequence documents fresh model-metre tuples sampled from the actual emitted boundary in normalized course order.
