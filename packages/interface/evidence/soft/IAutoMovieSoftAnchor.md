# src/soft/IAutoMovieSoftAnchor.ts#IAutoMovieSoftAnchor

## @evidence contracts/development/design.md#principled-representation

The solver sets anchor inverse mass to zero and rewrites its target each fixed step; restConfiguration resolves named overrides before static positions or the particle's rest coordinate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Identity, particle index and target describe the static condition; optional binding identifies a moving owner resolved by the boundary-aware path.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Validation requires binding and static position to be mutually exclusive. The static solver currently ignores binding metadata and uses static/rest targets; following the moving owner requires complete resolved boundaries, not an inferred scene or actor pose.

## @evidence contracts/development/common.md#meaningful-documentation

Comments state row-major indexing, world metres, null rest targets and the moving-frame exclusivity rule.
