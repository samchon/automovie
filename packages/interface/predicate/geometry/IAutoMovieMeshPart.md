# src/geometry/IAutoMovieMeshPart.ts#IAutoMovieMeshPart

## @evidence contracts/development/common.md#meaningful-documentation

Rigid member input for procedural mesh assembly. Its ID is copied into the matching output range and its optional transform places the mesh in assembly coordinates.

## @evidence contracts/development/design.md#principled-representation

The assembler checks duplicate IDs and reads triangles in declared member order. Mesh transforms are applied only when a placement is present.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each member carries its identity, mesh and optional placement. The assembler computes ranges from the resulting buffers.

# src/geometry/IAutoMovieMeshPart.ts#IAutoMovieMeshPart.id

## @evidence contracts/development/common.md#meaningful-documentation

Unique member ID inside one assembly. The merge compares strings as supplied and preserves the original ID.

# src/geometry/IAutoMovieMeshPart.ts#IAutoMovieMeshPart.mesh

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed unskinned geometry in its local metre frame. Merge reads the input buffers and builds new output buffers.

# src/geometry/IAutoMovieMeshPart.ts#IAutoMovieMeshPart.transform

## @evidence contracts/development/common.md#meaningful-documentation

Optional placement to assembly coordinates. Omission skips the placement step before concatenation.
