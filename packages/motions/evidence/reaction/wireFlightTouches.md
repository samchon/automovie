# src/reaction/wireFlightTouches.ts#wireFlightTouches.apply

## @evidence contracts/development/implementation.md#principled-implementation

A touch's ramp starts from the flight's own limb, keyed at the ramp's ends in the root's frame and carried by the root between them, as an animation curve's keys are.

## @evidence contracts/development/implementation.md#efficient-algorithms

Four keys per touch, each one resolve on the ramp's first read; every other second interpolates them.
