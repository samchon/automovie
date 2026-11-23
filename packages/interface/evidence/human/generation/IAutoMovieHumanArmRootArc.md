# src/human/generation/IAutoMovieHumanArmRootArc.ts#IAutoMovieHumanArmRootArc

## @evidence contracts/development/common.md#meaningful-documentation

The arm's arc of a shoulder ring at one height, published by its owner (the shoulders) for the ring's assembly and for the arm, which copies the arc at the ring's bottom layer: the anterior and posterior axillary guides, on the torso's own folds at the vault and where the arm's ellipse crosses the torso once the arm has merged, the lateral guide at the ellipse's outer extreme and the two sectors between them.

## @evidence contracts/development/design.md#principled-representation `anterior`: Lateral share of the torso's half width where the anterior guide stands. `posterior`: Lateral share where the posterior guide stands. `torso`: Weight of the torso's own axillary guides and flank rates in the arc's: 1 at the vault, where the ring is the torso's outside the arc, 0 where the arm has merged with the shoulder.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanArmRootArc.create. Read by AutoMovieHumanTrunkRing.speeds, AutoMovieHumanTrunkRing.controls.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `anterior`, `posterior`, `torso`, `guides`, `rates`, `front`, `back`; callers supply the complete record.
