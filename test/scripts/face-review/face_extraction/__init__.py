"""Offline Blender modules behind `extract-face-attachments.py`.

The face's articulation attachments are sampled from the pinned MPFB revision
inside Blender and never at runtime, so everything here imports `bpy` and runs
only under `blender --background --python test/scripts/face-review/extract-face-attachments.py`.
Each module owns one stage and the entry script names their order:

- `session`: enabling MPFB from its pinned source, creating the default human,
  binding the `default` rig's mandibular and ocular weights as vertex groups,
  and reading the evaluated (masked, subdivided) mesh and the helper base mesh.
- `correspondence`: matching every vertex of the committed face basis to a
  source vertex or a clipped source edge, so weights and endpoint samples are
  read in the basis's own vertex order.
- `recipes`: the candidate targets and macro states, and the measurement that
  recovers which of them each published shape endpoint is.

Coordinates leave these modules in the face basis frame: metres, Y up,
Z forward, `y = z_blender - offset` where the offset is solved against the
committed face basis from the top of the head.
"""
