# src/sport/racketStance.ts#racketStance

## @evidence contracts/development/common.md#meaningful-documentation

Describes the entry state, phase clock, direction, and support output.

## @evidence contracts/development/implementation.md#principled-implementation

Successive ankle arcs widen the stance. The pelvis moves toward the loaded foot before each departure. A split phase alone raises both feet and the pelvis together.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare the two stance transfers, publish the pelvis row, then publish a placement and matching plant windows per foot.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Stance transfer, clearance and shift proportions are authored defaults. Feet return to their own entry anchors.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each foot has at most three departures and two prepared swing curves. No sampled history is consulted.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the shared leg arc and sampling law for curved steps. Each prepared departure serves both the plant windows and the leg's bearing predicate.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds fixed preparation for the two legs and pelvis for the lifetime of the action.
