# src/human/generation/IAutoMovieHumanEventJoinRing.ts#IAutoMovieHumanEventJoinRing.IRing

## @evidence contracts/development/common.md#meaningful-documentation

Dense parent ring at an event and the arc weight of a phase on it.

## @evidence contracts/development/design.md#principled-representation `sp`: The parent's station at the event, mm. `points`: The ring's samples at uniform phases, mm. `length`: Length along the ring up to each sample, one more entry than the samples.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanEventJoinRing.parentRing. Read by AutoMovieHumanEventJoinRing.nearest.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `sp`, `points`, `length`, `weight`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanEventJoinRing.ts#IAutoMovieHumanEventJoinRing.ParentRingArcs

## @evidence contracts/development/common.md#meaningful-documentation

The parent's ring at an event and the weight of its phases on the child's arcs.

## @evidence contracts/development/design.md#principled-representation

The parent's ring at an event and the weight of its phases on the child's arcs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanEventJoinRing.ParentRingArcs is the canonical exchange used by AutoMovieHumanEventJoinRing.parentRing.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanEventJoinRing.parentRing for the parent's ring at an event and the weight of its phases on the child's arcs.

# src/human/generation/IAutoMovieHumanEventJoinRing.ts#IAutoMovieHumanEventJoinRing.NearestResult

## @evidence contracts/development/common.md#meaningful-documentation

Nearest point of a dense ring to p: its phase, the point on the closer neighbouring segment, the distance, and the nearest sample's index.

## @evidence contracts/development/design.md#principled-representation

Nearest point of a dense ring to p: its phase, the point on the closer neighbouring segment, the distance, and the nearest sample's index. Ordered tuple slots are 0, 1, 2, 3; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanEventJoinRing.NearestResult is the canonical exchange used by AutoMovieHumanEventJoinRing.nearest.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanEventJoinRing.nearest for nearest point of a dense ring to p: its phase, the point on the closer neighbouring segment, the distance, and the nearest sample's index.
