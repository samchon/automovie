# src/perform/HumanObjectCord.ts#HumanObjectCord

## @evidence contracts/development/common.md#meaningful-documentation

The cord inherits the line's radius, length and moving endpoints. The rest shape is a symmetric two-leg polyline with the supplied length.

## @evidence contracts/development/implementation.md#principled-implementation

The sag is the altitude of an isosceles triangle with legs of half the rest length and a base of the endpoint distance. Projected gravity or a perpendicular basis fixes its plane. Each segment contributes half its mass to each adjoining particle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Find the span, place its endpoints, discretize its rest shape, then apply the engine's domain admission.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unknown line, missing declared length, overextended starting pose or invalid soft domain is refused. The seed shape establishes rest distances without claiming equilibrium or disabling the caller's bend settings.

## @evidence contracts/development/implementation.md#efficient-algorithms

One model span lookup and one O(links) discretization plus the engine's lattice and collider admission. No pose, time integration or search is run here.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The model resolves both endpoints together and the engine owns soft-body admission.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns only the domain, its prop placement and span identities, with one particle more than the link count.
