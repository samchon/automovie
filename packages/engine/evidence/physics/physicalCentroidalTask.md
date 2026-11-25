# src/physics/physicalCentroidalTask.ts#physicalCentroidalTask

## @evidence contracts/development/implementation.md#principled-implementation

Herzog et al. 2016 and Orin, Goswami and Lee 2013: the linear momentum rate tracks the mass center by a PD with gravity compensated; the moment is taken about the mass center, where gravity's vanishes; the PD is the bounded implicit one the root's force uses.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the segments for the measured and the planned mass center, then the PD.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Gains, bounds and gravity are the caller's; nothing is tuned here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the segments.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The bodies move every substep, so nothing carries over.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh task; retains nothing.

## @evidence contracts/development/common.md#meaningful-documentation

States the task, its sources, the reference and why the mass center is read instead of the root.
