# src/geometry/IAutoMovieMeshClearanceWitness.ts#IAutoMovieMeshClearanceWitness

## @evidence contracts/development/design.md#principled-representation

Depth difference is affine on each triangle-pair intersection polygon, so its minimum lies at a clipped polygon vertex and one witness per vertex with the front triangle's barycentric weights expresses the gap as a linear function of the front vertices' travel.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carries exactly the linear constraint a solver needs, the pair, the front vertex ordinals, their weights and the current gap, so the minimizer builds its rows without re-clipping.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Weights are not clamped or renormalized to hide roundoff, and already clear witnesses are not filtered, so the solver sees every inequality its displacement must keep.

## @evidence contracts/development/common.md#meaningful-documentation

States the ordinal space, the order and roundoff of weights, the sign and unit of `gap`, the linear sensitivity, and that the arrays may be retained.
