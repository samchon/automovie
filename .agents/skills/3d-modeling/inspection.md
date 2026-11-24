# Inspecting a form

Apply visual debugging to form with the checks below.

## Measures

Write the form's `IAutoMovieFormExpectation` before measuring it, and check the form against it with `checkAutoMovieFormExpectation` from `@automovie/engine`. The check also tries the form's box and convex hull, which a useful expectation rejects. When it reports either as loose, add the empty point or genus that tells the form from it, or list it in `matches` when the form is meant to equal it.

Settle these by measurement before looking:

- overall dimensions against the real ones;
- clearances and contacts between parts;
- part and triangle counts;
- open edges and edges that more than two triangles share;
- reversed faces, triangles without area and a surface passing through itself.

## Coverage

Inspect [selected](../visual-debugging/capture.md#subject) curves and parts against the reference, first alone, then with neighbors that share boundaries or dependencies, then assembled. Use every [view](../visual-debugging/capture.md#views) the form requires.

Then inspect the assembled form in its final appearance at the distance it is used, and at its motion states: rest, intermediate, supported extremes, return, and shape-motion combinations.

## Forms defined by 2D views

Inspect original 2D definitions before accepting loft curves and the surface. Fix all affected definitions in one [correction round](../visual-debugging/correction-rounds.md).

A part whose 2D definitions are accepted goes straight to the 3D passes with its neighbors, whether or not unrelated parts are complete.

## Construction

Inspect the definitions that generate the surface:

- a curve network's sections, guides and cage;
- code CAD's sketches, axes and boolean operands;
- a procedural rule's skeleton;
- an implicit surface's primitives;
- a field's defining curves.

A mesh without a generating definition has no construction, so these passes take its place:

| Judging | Pass |
| --- | --- |
| Density, seams and how the triangles follow the form | Mesh edges over the shaded surface |
| Which way each face points | Front and back faces in different colors |
| Shading breaks | Normals shown as color |

Use the same camera for construction alone, construction over the shaded surface and surface alone. Apply all three passes to every planned selection. Keep joins visible.

Compare against the reference at each stage. Distinguish original 2D curves, derived 3D curves, unconnected studies, operands and joins. Verify paths and stage in the capture record.

## Light and material

Inspect form in clay under the scene's lights with material detail disabled. Judge lighting and materials in the beauty render.

## Fields judged only where needed

Judge coarse forms from silhouette and construction. Inspect weights, UVs, curvature or raking light where they affect the required use.

Supply these fields as marks from their owner when needed.
