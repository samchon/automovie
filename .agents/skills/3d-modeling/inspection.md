# Inspecting a form

What a form needs on top of the visual-debugging skill's rules for capturing, comparing and correcting any picture: its measures, its coverage, its construction, its light, and the fields judged only where needed.

## Measures

Settle these by measurement before looking:

- overall dimensions against the real ones;
- clearances and contacts between parts;
- part and triangle counts;
- open edges and edges that more than two triangles share;
- reversed faces, triangles without area and a surface passing through itself.

## Coverage

Apply the [selections](../visual-debugging/capture.md#subject) to the form's defining curves and parts: each alone against the reference, then each group whose members share boundaries or affect one another, against the same reference, before the assembly. Repeat them from every [view](../visual-debugging/capture.md#views) the form requires.

Then inspect the assembled form in its final appearance at the distance it is used, and at its motion states: rest, intermediate, supported extremes, return, and shape-motion combinations.

## Forms defined by 2D views

For a form defined by original 2D views, accept the placement and form of each part's original curves before its lofting curves and realized surface, because a smooth surface can still express a wrong input. A finished observation round is not a passed construction: correct the affected defining curves together in one [correction round](../visual-debugging/correction-rounds.md).

A part whose 2D definitions are accepted goes straight to the [3D passes](#construction) with its neighbors, whether or not unrelated parts are complete.

## Construction

Judge a surface only together with the construction that generated it, because the surface shows the symptom and the construction shows the value that causes it. Each kind of form has its own construction:

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

Every set of views shows the same cameras three times: the construction alone (for a lofted form, its lofting curves), the construction over the ordinary shaded surface, and the surface alone. This holds for whole sweeps, selected parts, neighbor groups and each defect's close-up, and no joining surface is hidden, because hiding one can create a false defect.

Keep the reference in the comparison passes, and tell apart original 2D definitions, the algorithm's 3D curves, unconnected studies, raw operands and realized joins. Confirm the selected paths and the observation stage from the capture's record.

## Light and material

Judge form in a clay shade under the scene's own lights, with fine material detail such as normal maps turned off, and judge materials and lighting in the beauty render, the fully shaded image.

## Fields judged only where needed

A coarse form is judged by its silhouette and construction, which the construction marks and the normal shade already show. Skin weights, texture coordinates, curvature and a raking light rig are judged only where the project's forms need them, such as a deforming mesh whose weights decide a bend.

The visual-debugging instrument has no built-in pass for them and draws such a field only when its owner hands it over as plain data in marks, so a missing heat map or checker is a decision, not a defect.
