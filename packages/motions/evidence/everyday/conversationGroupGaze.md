# src/everyday/conversationGroupGaze.ts#conversationGroupGaze

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the studied gaze roles, authored timing, units, and consuming gaze layer.

## @evidence contracts/development/implementation.md#principled-implementation

Selects the current speaker or authored addressee by role and uses the existing dyadic cadence provisionally for group glances.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Validates the roster and spans before delegating cadence to the shared glance planner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses scripted boundaries and person targets for every participant. The sources do not set a fixed anticipatory offset for general dialogue.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in participant IDs, spans and emitted requests, with a temporary roster set and the output array.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the seeded glance planner and the existing gaze layer. Each request sequence depends on its input spans and stream.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned requests outlive the call.
