# src/motion/perform/IAutoMovieActorWorldFrame.ts#IAutoMovieActorWorldFrame

## @evidence contracts/development/design.md#principled-representation

The frame representation matches resolveActorWorldFrame's staged rotation times motion-root rotation and rotated root translation; projected heading supports lookAt yaw calculations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps only the rigid quantities consumed by live action targeting, without claiming a complete staged affine transform.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Root scale and arbitrary nonuniform staged scale are not represented; no affine decomposition is silently approximated by this type.

## @evidence contracts/development/common.md#meaningful-documentation

States shot-local sampling, world metres, quaternion orientation and heading degrees with absent scale.
