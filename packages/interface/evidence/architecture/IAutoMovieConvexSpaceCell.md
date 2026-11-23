# src/architecture/IAutoMovieConvexSpaceCell.ts#IAutoMovieConvexSpaceCell

## @evidence contracts/development/design.md#principled-representation

Direct containment intersects inequalities with 1e-9 slack in each authored plane's scale. Corner enumeration normalizes retained planes, solves triples and uses 1e-6 for normal rejection, near-parallel determinants, admission distance and duplicate proximity. Those are distinct heuristics with different units; near-degenerate or extreme binary64 intermediates can lose or corrupt corners, so neither finite input admission nor four planes certifies a bounded numerical polyhedron.

## @evidence contracts/development/design.md#minimal-and-owned-surface

An id and a plane list are the whole cell, and the region's union, hierarchy, and fidelity stay on `IAutoMovieBuiltSpace`, so the cell carries no bounds or vertices that could disagree with its planes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Four planes is the minimum any bounded convex polyhedron needs, not a fixture-chosen count, and the unproven boundedness is stated in the prose rather than masked by clipping to an assumed box.

## @evidence contracts/development/common.md#meaningful-documentation

States that cells union into the space, the inside test and that a point on a plane counts as inside, what validation checks and does not prove, and how an unbounded cell behaves.
