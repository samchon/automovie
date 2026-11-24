# src/physics/physicalAuthoredCapture.ts#physicalAuthoredCapture

## @evidence contracts/development/common.md#meaningful-documentation

States the capture point and rate formulas, their source and the fallback at rest.

## @evidence contracts/development/implementation.md#principled-implementation

xi_a = c_a + c_a' / omega and its rate c_a' + c_a'' / omega, the authored motion playing IHMC's planner (main's G1.2); the acceleration is the input's numerical derivative (`trackPhysicalWorld`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The centre, the velocity and acceleration, then one sum each.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None; the fallback at rest serves recordings made before the command was read.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work beside the centre.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It reads one update's command.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
# src/physics/physicalAuthoredCapture.ts#physicalAuthoredCapture.IDesired

## @evidence contracts/development/common.md#meaningful-documentation

Names the planned capture point and rate.

## @evidence contracts/development/design.md#principled-representation

The recovery state's own record, world x and z.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the plans and the root's demand.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A type alias; no casts.
# src/physics/physicalAuthoredCapture.ts#physicalAuthoredCapture.center

## @evidence contracts/development/common.md#meaningful-documentation

States the centre and its fallback.

## @evidence contracts/development/implementation.md#principled-implementation

The command's authored centre of mass, else the mass-weighted sum of each authored segment's centre, moved by the landed root offset as the authored goals are.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The fallback sum, then the offset.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A non-null assertion reads each segment's authored target, which the sampler gives for every segment.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the segments for the fallback only.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

It reads one update.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
