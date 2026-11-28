# src/geometry/IAutoMovieMillimeterMesh.ts#IAutoMovieMillimeterMesh

## @evidence contracts/development/common.md#meaningful-documentation

Packed triangle positions and index triples borrowed by the mesh section readers. Use one millimetre coordinate frame. Supply finite coordinates and in-range whole vertex ordinals; the section reader assumes the buffer layout.

## @evidence contracts/development/design.md#principled-representation

Mesh extraction computes station distances and interpolates crossings directly from the packed buffer, so an ArrayLike input supports dense typed arrays without a coordinate copy.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The slicing representation carries geometry and connectivity. The caller supplies the section frame and station series independently.

# src/geometry/IAutoMovieMillimeterMesh.ts#IAutoMovieMillimeterMesh.positions

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed packed XYZ in the input frame, three finite millimetre values per vertex. Reading a section leaves this buffer intact.

# src/geometry/IAutoMovieMillimeterMesh.ts#IAutoMovieMillimeterMesh.indices

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed zero-based vertex ordinals, three in triangle winding order per face. The section reader computes the number of complete triples from this length.
