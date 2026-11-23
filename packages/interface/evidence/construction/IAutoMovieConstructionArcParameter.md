# src/construction/IAutoMovieConstructionArcParameter.ts#IAutoMovieConstructionArcParameter

## @evidence contracts/development/design.md#principled-representation

Arclength fits any closed curve, including the two long sides of a thin part lying along its host, where no phase line or centre angle crosses the curve once (Allgower and Georg, Numerical Continuation Methods, 1990).

## @evidence contracts/development/design.md#minimal-and-owned-surface

A record with only its discriminator; the walk needs only the seed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A walk that does not return to its start is reported, never closed by a chord.

## @evidence contracts/development/common.md#meaningful-documentation

States the walk, the foot rule, the zero and the direction of the parameter.
