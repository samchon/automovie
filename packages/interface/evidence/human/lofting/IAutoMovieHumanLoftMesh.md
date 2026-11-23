# src/human/lofting/IAutoMovieHumanLoftMesh.ts#IAutoMovieHumanLoftMesh.IContext

## @evidence contracts/development/common.md#meaningful-documentation

Growing vertex and index buffers in millimetres.

## @evidence contracts/development/design.md#principled-representation `positions`: Flat `[x, y, z, ...]` vertex positions in mm. `indices`: Flat triangle vertex indices. `groups`: Named triangle ranges in emission order: each group owns the triangles from its `start` index-buffer offset up to the next group's start.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLoftMesh.create, AutoMovieHumanLoftMesh.sampled. Read by AutoMovieHumanApertureConstruction.generate, AutoMovieHumanAperturePocket.loop, AutoMovieHumanBodyRoots.join. Also types AutoMovieHumanBodySurfaceContact.WEBS, AutoMovieHumanBodySurfaceContact.PINNED.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `positions`, `indices`, `groups`; callers supply the complete record.

# src/human/lofting/IAutoMovieHumanLoftMesh.ts#IAutoMovieHumanLoftMesh.IPiece

## @evidence contracts/development/common.md#meaningful-documentation

One named piece of a split mesh, with its own compact vertex buffers.

## @evidence contracts/development/design.md#principled-representation `name`: Group name. `positions`: Flat vertex positions in mm. `normals`: Flat unit vertex normals, copied from the whole mesh.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanLoftMesh.split. Also types AutoMovieHumanLoftMesh.pieces, AutoMovieHumanLoftMesh.entry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `name`, `positions`, `normals`, `indices`, `coordinates`; callers supply the complete record.

# src/human/lofting/IAutoMovieHumanLoftMesh.ts#IAutoMovieHumanLoftMesh.FansCaps

## @evidence contracts/development/common.md#meaningful-documentation

Optional pole-fan declarations for the source station grid. Each defined entry identifies its bottom/top end and its world-space apex in millimetres; an undefined entry adds no fan.

## @evidence contracts/development/design.md#principled-representation

Optional pole-fan declarations for the source station grid. Each defined entry identifies its bottom/top end and its world-space apex in millimetres; an undefined entry adds no fan.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLoftMesh.FansCaps is the canonical exchange used by AutoMovieHumanLoftMesh.fans.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanLoftMesh input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.

# src/human/lofting/IAutoMovieHumanLoftMesh.ts#IAutoMovieHumanLoftMesh.VerticesPoints

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed world-space [x, y, z] points in millimetres. The mesh writer appends them in this order and returns corresponding vertex indices without mutating the input tuples.

## @evidence contracts/development/design.md#principled-representation

Borrowed world-space [x, y, z] points in millimetres. The mesh writer appends them in this order and returns corresponding vertex indices without mutating the input tuples.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanLoftMesh.VerticesPoints is the canonical exchange used by AutoMovieHumanLoftMesh.vertices.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanLoftMesh input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
