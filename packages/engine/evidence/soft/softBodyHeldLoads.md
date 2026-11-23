# src/soft/softBodyHeldLoads.ts#softBodyHeldLoads

## @evidence contracts/development/common.md#meaningful-documentation

States the relation with its source, the sign and where the direction is read.

## @evidence contracts/development/implementation.md#principled-implementation

XPBD's constraint force from its multiplier.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the edges that touch a held particle.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An edge between two held particles carries no load onto the body and is skipped; a collapsed edge has no direction and is skipped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in particles times the twelve-slot stencil.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per step from that step's multipliers.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh map of at most one entry per held particle.
