# src/sport/poleVaultBend.ts#poleVaultBend.of

## @evidence contracts/development/common.md#meaningful-documentation

States the curve, its source, the chain's reading of it and what is prepared.

## @evidence contracts/development/implementation.md#principled-implementation

The pole between the tip and the top hand is the pinned elastica of the swing's chord (Timoshenko and Gere 1961, §2.7; the shape behind Linthorne 2000's force law, Hubbard 1980), straight above the hand. The chain reads it as a discrete elastic rod does (Bergou, Wardetzky, Robinson, Audoly and Grinspun 2008, "Discrete Elastic Rods", §4.1): each hinge turns by the integrated curvature over its dual domain, so each link lies along the tangent at its middle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The hinges' places, one parameter per swing step, then two readers: one hinge's turn and the whole chain.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The parameter is solved only at the model's own steps and read linearly between them; no turn is clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

One bracketed root per swing step at preparation; a hinge's turn is two elastica slopes and the chain one per link.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Prepared once per swing and read in place.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains one parameter per swing step and the hinges' places.
# src/sport/poleVaultBend.ts#poleVaultBend.IChain

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The shown chain's chord and its held link's direction, what the body's placement reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two numbers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Measured on the chain itself, so the tip the hinges show stays planted.

# src/sport/poleVaultBend.ts#poleVaultBend.IBend

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning.

## @evidence contracts/development/design.md#principled-representation

The hinges and two readers of the prepared bend.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the drives and the body read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Readers of a prepared table, no solve per read.

# src/sport/poleVaultBend.ts#poleVaultBend.IBend.turn

## @evidence contracts/development/common.md#meaningful-documentation

States the hinge, the second and the travel.

## @evidence contracts/development/implementation.md#principled-implementation

The integrated curvature over the hinge's dual domain (Bergou et al. 2008, §4.1): the slope at the middle of the link below less that above.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two elastica slopes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No clamp; the archetype's travel bounds it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads the prepared parameter.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/sport/poleVaultBend.ts#poleVaultBend.IBend.chain

## @evidence contracts/development/common.md#meaningful-documentation

States the second and what it returns.

## @evidence contracts/development/implementation.md#principled-implementation

Sums the links along their middle tangents up to the top hand and measures the chain's chord and the held link's turn from it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the links.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The chain's own geometry, not the smooth curve's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the links.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads the prepared parameter.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record.
