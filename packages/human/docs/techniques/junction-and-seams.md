# Junctions and seams between parts

## Industry practice

Unreal's modular characters keep each part a separate skeletal mesh and combine them by a leader pose, a copied pose, or a runtime merge into one mesh. Child meshes must be "a subset with the exact matching structure" of the leader's joints, and the runtime merge does not carry morph targets. The page says nothing about normals or vertex matching at part boundaries (`../sources/unreal-modular-characters.md`). Game practice therefore leaves seams to the artist: parts are modelled to meet, and a mismatch in normals or weights at the boundary shows as a line.

## Why Human joins at the cage

Human's plan avoids that class of defect by construction: parts meet as cages, the joined cage is subdivided once, and the seam becomes an interior region of one limit surface. Across a regular region the surface is C2, so position, normal and curvature are continuous across the former cut (`subdivision-and-cage.md`). Skin weights, UVs and every other attribute then come from the joined surface, not per part.

## Ring contract

- A ring is a closed edge loop on a tube cross-section, declared by count, orientation (counter-clockwise looking from the parent bone toward the child), a start mark on a named anatomical direction (for example anterior), and a frame from the skeleton.
- Both parts read one ring definition. A part never adapts to another; where counts differ, the junction owns the transition patch.
- A regular face's limit patch depends on 16 control vertices, the face plus one ring of neighbours, and a face at a valence N vertex on 2N + 8 (`../sources/stam-1998.md`). The limit surface next to a cut therefore depends on cage vertices of both parts, so neither part's appearance near the cut can be judged alone, and a part generator must not assume its boundary ring is the end of its surface.

## Transition patches

- A count change of n to n + 2 around a tube needs extraordinary vertices; OpenSubdiv's guidance is a valence 5 vertex to expand three loops into five (`subdivision-and-cage.md`). Each patch type is a typed, versioned topology in the junction module, and the profile's topology fixes which patch each junction uses, so every identity keeps the same connectivity.
- Place transition patches where curvature is already high or where the surface is out of direct light (the inner wrist, the medial ankle, under the jaw), never across a broad lit field.

## Semantic coordinates through the junction

Landmarks and garment bindings address (part, station, angle) or (patch, u, v). The junction maps each part's local coordinates to faces of the joined cage, so a coordinate survives joining and every identity change.

## Open questions for #2795

- Whether facial feature generators and the cranium share one cage (the plan says one continuous face surface) or the face is a patch-based cage with its own transition patches at the hairline and the jaw line.
- Whether the ear attachment, which is not a tube, gets its own ring shape (an oval with a fixed count) or is treated as a patch insert.
