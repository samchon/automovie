# src/geometry/IAutoMovieProfilePoint.ts#IAutoMovieProfilePoint

## @evidence contracts/development/design.md#principled-representation

A plain Cartesian pair whose meaning each builder fixes by its own construction plane, and which `finitePoint` and `autoMoviePlanarRegionFailure` admit before any geometry is emitted.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Kept as the engine's construction-profile name beside the interface's boundary-face point because a profile lives in a builder's own plane before extrusion or sweep, not in a built boundary's face frame; the identical shape lets shared planar checks take either.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No builder rounds, snaps or reorders profile points; rings are copied as authored and only rewound by the canonical region layout, which keeps each point's source index.

## @evidence contracts/development/common.md#meaningful-documentation

States the unit, how each family of builders maps the two axes, where finiteness is checked, and why planar region validation accepts it.
