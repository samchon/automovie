# src/sport/createBowlingPin.ts#createBowlingPin

## @evidence contracts/development/common.md#meaningful-documentation

Defines the pin's stance and targets.

## @evidence contracts/development/implementation.md#principled-implementation

USBC Equipment Specifications and Certifications Manual, Bowling Pin Measurements, gives the profile stations, nominal height and mass tolerance. Convex cells join adjacent station rings with a provisional crown closure.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Draw mass, make each station ring, join neighbouring rings and record the two aiming points.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No single convex hull fills the neck. Each coarse cell serves both rendering and collision, and the model does not claim certified inertia or materials.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The station and side counts are fixed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each model has its own part and mass accounting.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Construction retains no application state.
