# src/physics/configurePhysicalJointMotor.ts#configurePhysicalJointMotor

## @evidence contracts/development/common.md#meaningful-documentation

States the command, the motors it sets and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Each free axis's motor receives the command's target speed and implicit damping with the axis's declared torque bound in each direction, and the same PD's speed without its feed-forward torque, the posture the support cascade moves the joint toward; the solver applies them as a backward-Euler damper.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates the command to physicalJointMotorCommand, a second time without the feed-forward when one is given, and only stores the results.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A non-finite command throws instead of reaching the solver.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per free axis.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 4 allocation sites become the returned value or die with the call, so nothing grows.
