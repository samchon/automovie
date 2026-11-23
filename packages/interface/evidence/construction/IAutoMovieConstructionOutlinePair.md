# src/construction/IAutoMovieConstructionOutlinePair.ts#IAutoMovieConstructionOutlinePair

## @evidence contracts/development/design.md#principled-representation

A view of a solid shows two silhouette edges; storing each as a signed coordinate keeps an asymmetric part (the deeper front of a trunk, the medial bulge of a calf) without an offset or a symmetry assumption.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One pair type serves the front and the side view alike.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Signs are stated, not inferred: an edge that crosses the axis is reported, never mirrored or clamped.

## @evidence contracts/development/common.md#meaningful-documentation

States what each edge is, the sign each must keep and the effect of a box that does not hold its axis.
