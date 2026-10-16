# Junctions and seams between parts

## Industry practice

Unreal's modular characters keep each part a separate skeletal mesh and combine them by a leader pose, a copied pose, or a runtime merge into one mesh. Child meshes must be "a subset with the exact matching structure" of the leader's joints, and the runtime merge does not carry morph targets. The page says nothing about normals or vertex matching at part boundaries (`../sources/unreal-modular-characters.md`). Game practice therefore leaves seams to the artist: parts are modelled to meet, and a mismatch in normals or weights at the boundary shows as a line.

## Why Human joins at the cage

Human joins parts as cages before one subdivision, making a shared boundary an interior region of one limit surface. A regular region is C2 (`subdivision-and-cage.md`); this smoothness premise does not establish anatomical flow, absence of folds or injectivity. The current `AutoMovieHumanJunction` welds equal-count shared rings and refuses mismatched rings rather than adding a transition patch. UVs remain face-varying corner data with separate charts on either side; joined skin weights are still placeholders.

## Ring contract

- A ring is a closed edge loop on a tube cross-section, declared by count, orientation (counter-clockwise looking from the parent bone toward the child), a start mark on a named anatomical direction (for example anterior), and a frame from the skeleton.
- Both parts read one ring definition. Current Human refuses unequal counts; each part owns its internal transition to the shared count.
- A regular face's limit patch depends on 16 control vertices, the face plus one ring of neighbours, and a face at a valence N vertex on 2N + 8 (`../sources/stam-1998.md`). The limit surface next to a cut therefore depends on cage vertices of both parts, so neither part's appearance near the cut can be judged alone, and a part generator must not assume its boundary ring is the end of its surface.

## Transition patches

- A count change of n to n + 2 around a tube needs extraordinary vertices; OpenSubdiv's guidance is a valence 5 vertex to expand three loops into five (`subdivision-and-cage.md`). Current Human transitions sit inside part generators; matching counts at every shared junction make a junction transition module unnecessary. A future unequal-count profile would need an explicitly designed topology rather than silent resampling.
- Place transition patches where curvature is already high or where the surface is out of direct light (the inner wrist, the medial ankle, under the jaw), never across a broad lit field.

## Semantic coordinates through the junction

Face-corner physical addresses retain part/side and local parameters through joining; UV coordinates may be separately declared. These support physical evaluation and future garment binding, but they do not mean an implemented garment consumer exists. A semantic landmark must still preserve its measurement protocol when mapped to the final skin.

## Resolved construction questions

`AutoMovieHumanHeadGenerator` emits the continuous head cage, including facial network features. The ear is a separate generator joined through the shared eight-control attachment ring. `AUTOMOVIE_HUMAN_RINGS` fixes the neck-top boundary in the mandibular plane; it is not the early generic mid-neck-cut proposal. Head/jaw/nape and ear form still require their current issue's visual checks.
