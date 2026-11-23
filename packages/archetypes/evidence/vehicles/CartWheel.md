# src/vehicles/CartWheel.ts#CartWheel.IPair

## @evidence contracts/development/common.md#meaningful-documentation

States what it is and each member's meaning.

## @evidence contracts/development/design.md#principled-representation

A pair's track, radius and spokes in metres and a count, its axle's station, its parts' prefix and its spin knobs' ids.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; what `CartWheel` builds a pair from.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/vehicles/CartWheel.ts#CartWheel.pair

## @evidence contracts/development/common.md#meaningful-documentation

States what is built and the spin's sense.

## @evidence contracts/development/implementation.md#principled-implementation

A knob's `+Y` is the carrier's `+X`, so a positive turn rolls the wheel's top toward `+Z`, as rolling forward does. The spokes' count is read for the chariot's six and the wagon's twelve and fourteen; for the others it is a construction no act reads.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The axle, then one loop over the two sides.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidence contracts/development/implementation.md#efficient-algorithms

One rod per wheel and one per spoke pair.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every drawn kind's wheels are built here.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
