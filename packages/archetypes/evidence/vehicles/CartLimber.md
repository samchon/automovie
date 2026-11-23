# src/vehicles/CartLimber.ts#CartLimber.build

## @evidence contracts/development/common.md#meaningful-documentation

States what is built and where each place comes from.

## @evidence contracts/development/implementation.md#principled-implementation

The frame, `length` long, rests on the axle from `LIMBER.rear` behind it, and the pole runs `poleLength` on from its front, level, its end the `coupling`. The chest, its inside the Ordnance Manual's, stands over the axle on the frame; its lid hinges at its rear edge, opening a quarter turn to stand upright, and is the gunners' forward-facing `seat`. The `pintle` hook is at the frame's rear end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Frame, chest, pole, hook, wheels.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The chest's boards (`LIMBER.board`) are a construction estimate and the pintle's height (`LIMBER.pintle`) a named provisional value; the pole is level until a team's harness holds it.

## @evidence contracts/development/implementation.md#efficient-algorithms

About ten parts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
