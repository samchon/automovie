# src/perform/HumanSegmentLegs.ts#HumanSegmentLegs.resolved

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Leg fits run first (`orderHumanLimbs`), so the arms read the fitted legs; given as direct joints those same values are what the arms read, and the leg fit's own inputs are unchanged inside the window by the plan's statement, so its records are the fit's. The kept seeds keep the legs' plant check (`HumanSegmentPlant.settled`) as the fitted resolve sets it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One gate, then either the kept legs or a full resolve that keeps them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Outside the window, with a layer or overlay, continued, partial, or with a rest axis in a kept record, the full resolve runs.

## @evidence contracts/development/implementation.md#efficient-algorithms

Inside the window, two leg fits once for the window in place of at every leaf resolve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The kept records are the action's own fit's inside the window its plan states.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One record set per action, released by `HumanSegment.forget`.
