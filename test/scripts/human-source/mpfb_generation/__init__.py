"""Offline MPFB sampling for the human source generation (#2689).

The package runs only inside Blender against a pinned, separately acquired
MPFB checkout. It calls MPFB's own services at run time; no MPFB program code
is copied into this repository (MPFB code is GPL-3.0-or-later, its bundled
graphical data CC0-1.0). What this package writes is numerical data sampled
from that CC0 data.

Modules:

- `session`: the default MPFB human with both weight bindings and the one
  limit-surface subdivision both published bases measured against.
- `catalogue`: which states are sampled (body regional targets, macro nodes and
  pairs, face-region targets, extra-target expressions) and the source
  convention each name follows.
- `landmarks`: joint-cube centroids of the helper base mesh.
- `flatten`: the product exclusion of nipple geometry as a linear fill operator.
- `parts`: the five attached face parts refitted by MPFB under each macro state.
- `store`: the deterministic binary layout the TypeScript compiler reads.
"""
