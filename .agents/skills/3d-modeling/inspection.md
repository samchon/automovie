# Inspecting a form

[Visual debugging](../visual-debugging/SKILL.md) owns how any picture is captured, compared and corrected. This document owns what a form adds to it: its measures, its coverage, its construction and its light.

## Measures

Settle these by measurement before looking:

- overall dimensions against the real ones;
- clearances and contacts between parts;
- part and triangle counts;
- open edges, edges that more than two triangles share, reversed faces, triangles without area and a surface passing through itself.

## Coverage

Inspect each defining curve and part in isolation against the reference. Then choose groups that share boundaries or affect one another and inspect them together against that reference, before judging the assembly. Repeat the individual and grouped selections from front, side and top, around the back and from high and low obliques as the form requires, because front and side alone hide oblique sections and junctions.

A hidden reference or separate passing close-ups establish no relationship between neighbors.

Inspect the assembled form in its final appearance at the distance it is used, and at its motion states: rest, intermediate, supported extremes, return, and shape-motion combinations.

## Forms defined by 2D views

For a form defined by original 2D views, establish the placement and form of each part's original curves before accepting the algorithm's lofting curves and realized surface. A completed observation round is not a passed construction: correct the affected defining-curve causes together and repeat their comparison, because a smooth downstream surface can still express the wrong input.

Take a part with accepted 2D definitions straight to the [3D passes](#construction) with its neighbors; unrelated parts need not be complete.

## Construction

Judge a surface only with the construction that generated it, because the surface shows the symptom and the construction shows the value that causes it:

- a curve network's sections, guides, and cage;
- code CAD's sketches, axes, and boolean operands;
- a procedural rule's skeleton;
- an implicit surface's primitives;
- a field's defining curves.

A mesh without a generating definition has no construction, so these passes take its place:

| Judging | Pass |
| --- | --- |
| Density, seams and how the triangles follow the form | Wireframe over the shaded surface |
| Which way each face points | Front and back faces in different colors |
| Shading breaks | Normals shown as color |
| Skin weights | One joint's weights as a heat map, joint after joint |
| Texture coordinates | A checker texture |

Every set of views shows the same cameras three times: the 3D construction alone (the actual lofting curves for a lofted form), that construction over the ordinary shaded surface, then the surface alone. This holds for whole sweeps, selected parts, neighbor groups and each defect's close-up alike.

Keep the reference in the comparison passes and distinguish original 2D definitions, the algorithm's 3D curves, unconnected studies, raw operands and realized joins. Verify the selected ids and observation stage through the actual viewer controls.

Hiding a joining surface can create a false defect.

## Light and material

Judge form under raking light with fine material detail such as normal maps turned off, and judge materials and lighting in the beauty render, the fully shaded image.
