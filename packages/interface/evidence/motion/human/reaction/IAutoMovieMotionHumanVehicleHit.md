# src/motion/human/reaction/IAutoMovieMotionHumanVehicleHit.ts#IAutoMovieMotionHumanVehicleHit.Trajectory

## @evidence contracts/development/common.md#meaningful-documentation

Names the four trajectory classes; the namespace states when each occurs and its source.

## @evidence contracts/development/design.md#principled-representation

A closed union of the frontal impact classes of Ravani, Brougham and Mason (SAE 811024).

## @evidence contracts/development/design.md#minimal-and-owned-surface

planVehicleHit computes it from the contact and branches on it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per class; the class is computed, never authored.

# src/motion/human/reaction/IAutoMovieMotionHumanVehicleHit.ts#IAutoMovieMotionHumanVehicleHit.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit and default.

## @evidence contracts/development/design.md#principled-representation

Subject and affordance ids and seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `vehicleHit.plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The contact instant is found on the car's course, not authored.

# src/motion/human/reaction/IAutoMovieMotionHumanVehicleHit.ts#IAutoMovieMotionHumanVehicleHit.IDive

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The car by subject id and the side dived to.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `vehicleDive.plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The dive is timed by the car's arrival on its course.
