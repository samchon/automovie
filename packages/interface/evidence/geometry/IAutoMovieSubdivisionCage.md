# src/geometry/IAutoMovieSubdivisionCage.ts#IAutoMovieSubdivisionCage

## @evidence contracts/development/design.md#principled-representation

Positions and UVs use the glTF packed layout of `IAutoMovieMesh`, faces are index polygons, and UV topology is the indexed face-varying model of OpenSubdiv, so seams are declared by index rather than inferred from coincident values.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record holds exactly what Catmull-Clark needs: vertex positions, polygon connectivity, optional face-varying UVs and optional edge sharpness; boundaries need no declaration because they follow from connectivity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Nothing is repaired: a non-manifold edge, inconsistent winding, a vertex with two fans, an unused vertex or UV, or a UV shared by two vertices is refused by `subdivideAutoMovieSurface`.

## @evidence contracts/development/common.md#meaningful-documentation

States the manifold, winding and usage requirements, the face-varying UV model and how a seam is expressed, the units and layouts, and what omitted UVs and creases mean.
