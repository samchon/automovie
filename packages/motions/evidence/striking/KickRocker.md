# src/striking/KickRocker.ts#KickRocker

## @evidence contracts/development/common.md#meaningful-documentation

States the limit, its source, the pivot and the case that showed it.

## @evidence contracts/development/implementation.md#principled-implementation

The forefoot rocker: the heel rises about the metatarsophalangeal axis only as far as the ankle's weight-dependent range requires, and the toes extend by the same angle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The plant's sole read once; each query one heel-rise search and one pivot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The limits are the engine's measured ones, blended by the shared weight rule.

## @evidence contracts/development/implementation.md#efficient-algorithms

One bounded one-dimensional search per query; a foot inside its range is returned unturned.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses walkLeg.heelRise and HumanFoot.pivot.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains the plant's sole only.
