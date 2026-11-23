# src/animals/EquineFlightClock.ts#EquineFlightClock.of

## @evidence contracts/development/common.md#meaningful-documentation

States each output and the case without a jump.

## @evidence contracts/development/implementation.md#principled-implementation

Each event's phase is read through the assembly's own phase-to-seconds map, so a hold shifts every later event. The trunk's height and pitch through the jump are EquinePitch's plan about the centre of mass, continuous in height, pitch and their rates.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Kept apart from `rideQuadruped` for its size.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Six phase reads and one pitch plan per assembly.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the stride plan's `secondsAt`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one small record.

# src/animals/EquineFlightClock.ts#EquineFlightClock.carries

## @evidence contracts/development/common.md#meaningful-documentation

States the phases and the result.

## @evidence contracts/development/implementation.md#principled-implementation

A swing spanning the held phase is in the air while the body flies, so the body carries it from its own liftoff (`swing`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One test.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the flight's held phase.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a boolean.

# src/animals/EquineFlightClock.ts#EquineFlightClock.IAim

## @evidence contracts/development/common.md#meaningful-documentation

Model metres and the terminal's orientation and support.

## @evidence contracts/development/design.md#principled-representation

The hoof track's goal fields.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read and returned by `swing`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineFlightClock.ts#EquineFlightClock.swing

## @evidence contracts/development/common.md#meaningful-documentation

States the frames, the blend and the ground bound.

## @evidence contracts/development/implementation.md#principled-implementation

The two ends are the hoof track's own goals at the body's placements then, so the goal meets the stance goal at liftoff and at landing. Between them the body-frame position and orientation blend by the swing's progress (a plane the track leaves as the model floor is that floor). The support plane is the two footholds' ground, blended in the world and turned into the current body's frame, so the solid's clearance is measured from the ground; a carried contact below that plane is raised onto it along its normal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two goal reads, one blend and one plane bound.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The footholds are the track's; only the path between them follows the body, and the ground bound only raises.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two goal reads, only for a carried swing.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the hoof track's goal.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one goal.

# src/animals/EquineFlightClock.ts#EquineFlightClock.IClock

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit.

## @evidence contracts/development/design.md#principled-representation

Seconds, instants and a pitch plan present only with a jump.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the ride's body placement, tucks and instants.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
