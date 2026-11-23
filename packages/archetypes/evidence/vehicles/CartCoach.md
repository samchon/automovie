# src/vehicles/CartCoach.ts#CartCoach.wagon

## @evidence contracts/development/common.md#meaningful-documentation

States what is built and where each place comes from.

## @evidence contracts/development/implementation.md#principled-implementation

The specification's wheels, track, king-bolt station and tongue on the running gear, the tongue's end hanging `WAGON.drop` above the ground; the body's inside length, width and depth, its floor `WAGON.bed` above the hind axle, centred between the axles; the `bed` affordance on its floor. The hind wheels have fourteen spokes and the front twelve, as specified, and iron tyres: the specification's tyre, 2.5 in wide and 5/8 in thick, is bolted through each felloe, as only a metal tyre is (p. 1), so the wagon rests on iron, measured against stone.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Running gear, then the body.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The body's floor height and the front axle's lock are named provisional values; the cover, the bows and the feed trough are not built.

## @evidence contracts/development/implementation.md#efficient-algorithms

About forty parts, most of them spokes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/vehicles/CartCoach.ts#CartCoach.carriage

## @evidence contracts/development/common.md#meaningful-documentation

States what is built and where each place comes from.

## @evidence contracts/development/implementation.md#principled-implementation

The museum broughams' wheels, wheelbase, length, width and height; the track the width less `CARRIAGE.hubs`; the carriage centred on its wheelbase; the closed body from the rear to just behind the front wheels' reach, its roof at `height`, a door on each side in its middle with the opening behind it, as `createCar`'s doors are, and a forward-facing seat across its back; the driver's `box` over the front axle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Running gear, the body, the doors, the seats.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The track, the floor, the seats, the doors, the pole and the lock are named provisional values (`CARRIAGE`); the lamps, the glass and the springs are not built.

## @evidence contracts/development/implementation.md#efficient-algorithms

About forty parts, most of them spokes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
