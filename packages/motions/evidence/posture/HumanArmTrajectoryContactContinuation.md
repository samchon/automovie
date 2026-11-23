# src/posture/HumanArmTrajectoryContactContinuation.ts#HumanArmTrajectoryContactContinuation

## @evidence contracts/development/common.md#meaningful-documentation

States the source boundary and retained physical admission.

## @evidence contracts/development/implementation.md#principled-implementation

Each new contact pose continues its neighbour's actual elbow-to-contact circle and the resulting splices are admitted on the native full frame grid.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Trace the endpoint components into the longest admitted interval, select a low-speed admissible join, then admit the entire course on the original clock.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every rig, site, crossing, sweep, range and speed constraint remains active; a failed alternative returns the original course.

## @evidence contracts/development/implementation.md#efficient-algorithms

A linear scan finds the admitted interval. Each endpoint component advances until a safe join introduces no speed peak, the branch loses feasibility, or the opposite boundary is reached.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the original per-time placement context and admitted hold coordinates. The interval contexts serve all terminal components and untouched original coordinates are borrowed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Candidate coordinates and contexts are local to the course call.
