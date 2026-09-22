"""Offline Blender modules behind `extract-body-basis.py`.

The body basis is sampled from the pinned MPFB revision inside Blender 5.2
and never at runtime, so everything here imports `bpy` and runs only under
`blender --background --python test/scripts/body-review/extract-body-basis.py`.
Each module owns one stage and the entry script names their order:

- `session`: enabling MPFB from its pinned source, creating the default human,
  binding the game_engine skin weights as vertex groups, and reading the
  evaluated (masked, subdivided) mesh for the neutral and every endpoint state.
- `channels`: the signed channel table derived from MPFB's `target.json` and
  macro axes, so the endpoint list is read from the source, not typed by hand.
- `clip`: the shared-edge neck clip stencil that keeps the body below the face
  basis plane and evaluates every endpoint through the same affine weights.
- `rig`: joint landmarks from the MPFB joint cubes, the VRM bone mapping, the
  anatomical flexion references, clinical signs and constraints per joint.
- `receipt`: mirror pairing, ring agreement with the committed face basis,
  displacement statistics and the digest record that makes a revision
  reproducible.

Coordinates leave these modules in the face basis frame: metres, Y up,
Z forward, `y = z_blender - offset` where the offset is solved against the
committed face basis so that the neck ring is shared by vertex identity.
"""
