# src/perform/HumanPropFlightFrame.ts#HumanPropFlightFrame.sample

## @evidence contracts/development/common.md#meaningful-documentation

States the selected flight, film clock and displayed frame.

## @evidence contracts/development/implementation.md#principled-implementation

Samples the engine trajectory before contact, the realized continuation after contact, or the settled frame on the struck carrier.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Projects the displayed origin after choosing the flight or continuation sample.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Respects recorded contact times and keeps the display offset for extended shapes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Traverses only the chosen flight's continuation legs and demands the struck carrier frame only when settled.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Samples the already-built trajectory without collision searches or a second trajectory.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows existing flight data and keeps no query cache.

# src/perform/HumanPropFlightFrame.ts#HumanPropFlightFrame.contactOf

## @evidence contracts/development/common.md#meaningful-documentation

Defines contact geometry, its recorded flight velocity, physical outcome and carrier-relative rest.

## @evidence contracts/development/implementation.md#principled-implementation

Reads the engine state at the hit, uses the launch's collision radius for the outcome, and projects physical centre and settled embedding into the displayed frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The outcome owner decides contact physics, and the frame owner applies the borrowed carrier transform.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Leaves the engine hit point and velocity as observed and records embedding only where the body's data grants it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads only the meeting, its outcome and the target frame. An explicit sphere supplies its radius without projecting model shapes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the displayed-origin projection with flight sampling.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains only contact observations and the new rest transform.
