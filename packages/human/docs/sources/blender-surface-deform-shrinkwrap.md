# Blender, Surface Deform and Shrinkwrap modifiers

Blender 5.2 LTS Manual, "Surface Deform Modifier", https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/surface_deform.html, and "Shrinkwrap Modifier", https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/shrinkwrap.html. Read 2026-10-23.

## Licence

Manual under CC BY-SA 4.0. Read for technique comparison only.

## What it says

Surface Deform:

- Lets the surface of one mesh drive the deformation of another, for example a detailed mesh driven by a simpler cloth proxy.
- Binding records, in world coordinates, the bound mesh against the target's current surface; later changes to the target's mesh data deform the bound mesh, while object transforms after binding are ignored. Until a bind is executed the modifier does nothing.
- Interpolation falloff sets how strongly surrounding faces influence a bound vertex: lower is smoother but can add artifacts.
- The target must have no edges shared by more than two faces, no concave faces, no overlapping vertices and no faces with collinear edges; the further the bound mesh lies from the target, the more likely artifacts are.

Shrinkwrap:

- Moves each vertex onto another object's surface by nearest surface point, projection along an axis or the normal, nearest vertex, or target normal projection (smoother but slower: it seeks the nearest point whose smoothed normal faces the vertex).
- Snap modes: On Surface; Outside Surface (offset always toward the outside); Above Surface (offset along the smooth normal); Inside and Outside, which leave vertices already on the allowed side unmoved and serve as rough collision, unreliable near sharp angles of the target.
- Offset keeps a distance between the vertex and the computed target point.
