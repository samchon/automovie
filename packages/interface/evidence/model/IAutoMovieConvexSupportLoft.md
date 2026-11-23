# src/model/IAutoMovieConvexSupportLoft.ts#IAutoMovieConvexSupportLoft

## @evidence contracts/development/design.md#principled-representation

Fixed oriented inequalities and complete cubic Bernstein offset profiles define a continuous section family without row samples or a source mesh. Plane intersections determine its boundary curves and their changes in incidence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One plane registry and ordered offset spans own both generated surfaces and construction; generation budgets and observation uncertainty belong to their respective callers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No source positions, triangle indices, normals, per-row polygon table or hidden cap supplies the section field. A convex intersection does not identify a hidden concavity or certify an enclosure of unknown true geometry.

## @evidence contracts/development/common.md#meaningful-documentation

States metre units, outward unit normals, inequality sign, Bernstein ordering, shared endpoints, convex-section interpretation and open/unsupported regions.
