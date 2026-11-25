# src/physics/solveXpbdContactVelocities.ts#solveXpbdContactVelocities

## @evidence contracts/development/common.md#meaningful-documentation

States dynamic friction's budget and the restitution rule.

## @evidence contracts/development/implementation.md#principled-implementation

Mueller et al. 2020, sec. 3.6: dynamic friction bounded by the cone's remaining impulse, then the normal velocity set to the restitution of the pre-step approach above 2 g h.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Friction then normal, each with its own generalized inverse mass.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only pressing contacts are treated.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in contacts per sweep.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The friction budget accumulates on the contacts for the step only.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates only the bodies it is given; allocates only transient vectors.
