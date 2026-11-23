# src/architecture/IAutoMovieConnectorSteps.ts#IAutoMovieConnectorSteps

## @evidence contracts/development/design.md#principled-representation

Validation compares `count * rise` with the route's net vertical change and `count * run` with its summed horizontal segment length, each within 1 mm; because the climb is net, a route that rises and then falls is checked only by its end-to-end difference.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three scalars describe one uniform flight, so uneven risers and winders are not representable, and the record has a single reader in `validateBuiltEnvironment`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The 1 mm tolerance is one named constant stated in the prose, no connector kind is exempt, and the route totals are compared only after count, rise, and run are themselves valid so one defect is not reported twice.

## @evidence contracts/development/common.md#meaningful-documentation

States the metre units, the safe-integer count floor, the millimetre tolerance, exactly which route quantities the totals must match, and that nothing renders treads from it.
