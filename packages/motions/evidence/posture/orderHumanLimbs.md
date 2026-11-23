# src/posture/orderHumanLimbs.ts#orderHumanLimbs

## @evidence contracts/development/common.md#meaningful-documentation

States the default order, the attachment dependencies and the cycle refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Topologically orders the four limb nodes by the owner of each attached goal's bone, preserving legs before independent arms.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads each attachment, rejects a mutual dependency and visits each limb after its dependency.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An attachment cycle refuses rather than depending on the order the limbs happen to be stored in.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most four nodes and one dependency per node; the depth bound also rejects a longer cycle.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The resolver and its final contact refit share this single order.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns only the ordered names and retains nothing.
