# src/vehicles/CarBody.ts#CarBody.ILayout

## @evidence contracts/development/common.md#meaningful-documentation

States each member's meaning.

## @evidence contracts/development/design.md#principled-representation

Heights and fore-and-aft stations in metres, the driving side as a sign, and the drawn dimensions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned here; made by `layout` and read by this module's builders and `CarCabin`'s.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The dimensions a class lacks stay absent, read only by the builders of the parts that class has.

# src/vehicles/CarBody.ts#CarBody.layout

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The front overhang takes `OVERHANG` of the length beyond the wheelbase; the front doors stand `DOOR_AXLE` behind the front axle and `DOOR_SPAN` long, and the seating reference point `PILLAR_SGRP` ahead of the middle pillar and `seatHeight` above the floor (SAE J1100's H30), the measured sedans' values; the ball of foot lies SAE J1516's tool reference distance ahead of it (`seatAft`) on the pedal plane at J1516's angle (`pedalPlane`), the heel point `BALL` back down that plane on the floor; the steering wheel `WHEEL_AFT` behind the ball of foot and `WHEEL_HEIGHT` above the heel; the firewall `DOOR_LEAD` ahead of the front doors; the belt (`BELT` above the rocker's lower edge, `ROCKER`) and the windows' top (`WINDOW` above the belt) at the measured heights; the doors' openings start at the floor; a pickup's belt at its bed's rail; a sedan's and a hatchback's cabin ends at the rear doors' trailing edge, `REAR_DOOR` behind the front doors; a van's floor is its side step and its cabin runs to its rear doors, a pickup's cab ends where its bed begins.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record of derived planes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The unsourced offsets are `createCar`'s marked constants.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/vehicles/CarBody.ts#CarBody.shell

## @evidence contracts/development/common.md#meaningful-documentation

States what is built.

## @evidence contracts/development/implementation.md#principled-implementation

Boxes, rods and convex prisms on the layout's planes; the front rises from the bumper's top and the bonnet's leading edge to the belt at the windscreen's foot. The bonnet's hinge lies on its rear edge with `+Y` along `-X`, so a positive turn lifts its front edge, the right-hand rule taking `+Z` toward `+Y`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The common shell only.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None beyond the layout's marked constants.

## @evidence contracts/development/implementation.md#efficient-algorithms

A few tens of parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/vehicles/CarBody.ts#CarBody.wheels

## @evidence contracts/development/common.md#meaningful-documentation

States the chain of articulations.

## @evidence contracts/development/implementation.md#principled-implementation

Each wheel stands out to the doors' outer faces with a hub bar across its face, so a spin shows. A spin knob's `+Y` is the car's `+X`, so a positive turn rolls the wheel's top forward, toward `+Z`, as rolling forward does; `driveCar` sets it from the distance. The steering is a two-sided `wheel` articulation about the upright through the wheel's centre, following `wheel` through a table of Ackermann angles at `STEER_STEP` spacing with a row at straight ahead.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the four wheels.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The steering table is interpolated linearly, within a hundredth of a degree of the exact angle, as `STEER_STEP` states.

## @evidence contracts/development/implementation.md#efficient-algorithms

A table of about eighty rows per front wheel.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/vehicles/CarBody.ts#CarBody.bulkhead

## @evidence contracts/development/common.md#meaningful-documentation

States what it places and why.

## @evidence contracts/development/implementation.md#principled-implementation

The van's sheet gives the load length to the bulkhead, so `layout` stands the bulkhead's face that far ahead of the rear doors' inner face and closes the cab there, its middle pillar.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One read of the layout, by this module and `CarCabin`.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
