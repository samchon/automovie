# src/physics/bindPhysicalWorld.ts#bindPhysicalWorld

## @evidence contracts/development/common.md#meaningful-documentation

States what is created per segment, shape, joint and the floor, and the restored case.

## @evidence contracts/development/implementation.md#principled-implementation

Each segment becomes one body with the profile's mass, centre and principal inertia; each shape one collider with its material's friction and restitution; each joint one world joint whose frames, axes and limits are the profile's. Restored worlds are reconnected by creation order, which the snapshot preserves. The literal 0.7 is the floor's declared friction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass per body over segments, shapes and joints, then the derived orders and the floor; creation is the world's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every segment, shape and joint of every admitted body is bound; none is special-cased.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in segments, shapes and joints, plus the quadratic joint ordering pass over each profile's joints.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its 66 allocation sites become the returned value or die with the call, so nothing grows.
