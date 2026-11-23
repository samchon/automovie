# src/render/exposure/autoMovieIncidentEv100.ts#autoMovieIncidentEv100

## @evidence contracts/development/implementation.md#principled-implementation

The incident-light meter equation of ISO 2720:1974 at ISO 100 with the standard's flat-receptor calibration constant 250. Non-positive or non-finite illuminance has no logarithm and is refused.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Kept apart from the meter so a production can set exposure from any illuminance it states.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The constant is named with its source.

## @evidence contracts/development/common.md#meaningful-documentation

States the equation, its constants, how it pairs with the film's exposure mapping to put a grey card at 0.1194 linear, and the refusal.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One logarithm.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Constant time; nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
