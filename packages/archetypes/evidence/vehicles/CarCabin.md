# src/vehicles/CarCabin.ts#CarCabin.doors

## @evidence contracts/development/common.md#meaningful-documentation

States which class has which door and what each carries.

## @evidence contracts/development/implementation.md#principled-implementation

A hinged door's axis is its front edge with `+Y` pointing so a positive travel swings it outward; its window is a `slider` riding it, running down along `+X` by the glass's height; the window's opening is an `aperture` riding the glass, its threshold the glass's top edge, so the clear opening is the window frame's top less that threshold and grows to `height` as the glass goes down. A van's sliding door runs back along the side by its opening's width.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper per door, called per side.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A sliding door runs inside the side wall's plane, not out and along it as its track does; stated, not hidden.

## @evidence contracts/development/implementation.md#efficient-algorithms

A few parts per door.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/vehicles/CarCabin.ts#CarCabin.seats

## @evidence contracts/development/common.md#meaningful-documentation

States which seats each class has.

## @evidence contracts/development/implementation.md#principled-implementation

Each seat is a cushion whose `seat` affordance sits on its front edge facing forward, laid out from its seating reference point: the front pair's the layout's, the rear bench's `REAR_SGRP` ahead of the rear doors' trailing edge, which lies `REAR_DOOR` behind the front doors, at the front seats' height (a provisional value, see `HIP`); its back turns about the cushion's rear edge with `+Y` along `-X`, so a positive travel tips its top back toward `-Z`, by up to `recline`. A back whose `recline` is 0, the band's lower end, has no hinge, since a hinge's travel must be positive.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One helper per seat.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None beyond the layout's marked constants.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A few parts per seat.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/vehicles/CarCabin.ts#CarCabin.controls

## @evidence contracts/development/common.md#meaningful-documentation

States what is built and what is not.

## @evidence contracts/development/implementation.md#principled-implementation

The steering wheel's rim on its column's axis tilted back by `steeringAngle`, its centre `WHEEL_AFT` behind the ball of foot and `WHEEL_HEIGHT` above the heel point (SAE J1100's L6 and H17 of a mid-size sedan), turning half the lock-to-lock turn each way with one spoke across it so a turn shows; the accelerator's plate lies on SAE J1516's pedal plane at the ball of foot, facing the sole, `FOOT` to the right of the driver's centre line (ISO 6549).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Wheel, then accelerator.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every offset is a sourced `createCar` constant.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A handful of parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
