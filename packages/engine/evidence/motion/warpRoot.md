# src/motion/warpRoot.ts#warpRoot

## @evidence contracts/development/common.md#meaningful-documentation

Cites the method, states the window profile, the before and after behaviour and the order of yaw and translation.

## @evidence contracts/development/implementation.md#principled-implementation

A displacement map blended by the minimum-jerk profile (Witkin and Popović 1995).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One profile read and one composition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A window that does not move forward throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work; the private unchanged +Y axis shares its magnitude preparation after first actual use, while every varying yaw still computes its original sine/cosine, Hamilton product and normalization. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One lazy module-owned reader reuses only the private canonical +Y axis scalars. Window validation and profile/translation/yaw reads retain their original order; every root/yaw remains a fresh actual computation with no result cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The module retains at most one lazy reader and its private fixed axis/direction-length metadata. First use acquires it at the original axis-angle site; no root, window, angle or quaternion result is retained. Fresh output belongs to the caller and the fixed population releases with the module.
