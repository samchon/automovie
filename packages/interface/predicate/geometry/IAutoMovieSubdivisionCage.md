# src/geometry/IAutoMovieSubdivisionCage.ts#IAutoMovieSubdivisionCage

## @evidence contracts/development/common.md#meaningful-documentation

The cage documents authored ownership, local metres, manifold polygons and the relation between geometry and UV corners.

## @evidence contracts/development/design.md#principled-representation

Cage admission requires dense finite position and UV buffers and safe original ordinals before compiling manifold fans. It validates UV ownership and crease addresses while preserving admitted nonquad source faces.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The input carries one physical surface and its optional edge and UV records. The admitted level owns the compiled adjacency and chart addresses.

# src/geometry/IAutoMovieSubdivisionCage.ts#IAutoMovieSubdivisionCage.positions

## @evidence contracts/development/common.md#meaningful-documentation

The packed XYZ array in metres supplies one finite triple per original vertex.

# src/geometry/IAutoMovieSubdivisionCage.ts#IAutoMovieSubdivisionCage.faces

## @evidence contracts/development/common.md#meaningful-documentation

Each row lists distinct vertex ordinals in counterclockwise outward order and carries at least three corners.

# src/geometry/IAutoMovieSubdivisionCage.ts#IAutoMovieSubdivisionCage.uvs

## @evidence contracts/development/common.md#meaningful-documentation

Optional packed pairs are supplied together with face-corner UV rows and preserve seam identity.

# src/geometry/IAutoMovieSubdivisionCage.ts#IAutoMovieSubdivisionCage.uvFaces

## @evidence contracts/development/common.md#meaningful-documentation

Every row is aligned to its geometric polygon, with an independent index for each face corner.

# src/geometry/IAutoMovieSubdivisionCage.ts#IAutoMovieSubdivisionCage.creases

## @evidence contracts/development/common.md#meaningful-documentation

The optional list assigns sharpness only to authored undirected cage edges. Absent entries use smooth interior rules.
