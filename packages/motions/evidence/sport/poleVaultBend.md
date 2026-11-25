# src/sport/poleVaultBend.ts#poleVaultBend

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
