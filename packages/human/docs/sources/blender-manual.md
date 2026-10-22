# Blender manual, mesh structure and Subdivision Surface modifier

Blender Foundation, Blender manual. Read from the manual sources: https://projects.blender.org/blender/blender-manual/raw/branch/main/manual/modeling/meshes/structure.rst and https://projects.blender.org/blender/blender-manual/raw/branch/main/manual/modeling/modifiers/generate/subdivision_surface.rst.

## Licence

Manual text is CC BY-SA.

## What it says

- Poles are vertices with three, five or more edges; loops stop at poles.
- Edge loops "follow the natural contours and deformation lines of the skin and the underlying muscles" and are "denser in areas that deform more when the character moves, for example at the shoulders or knees"; used well, they let models with few vertices look natural as subdivision surfaces and deform well.
- Quads "deform well" and are preferred for animation and subdivision modelling.
- Subdivision Surface modifier: "Use Limit Surface" places vertices on the limit; UV Smooth offers None, Keep Corners, Keep Corners and Junctions, Keep Corners, Junctions and Concave, Keep Boundaries, and All; weighted edge creases resist smoothing.
