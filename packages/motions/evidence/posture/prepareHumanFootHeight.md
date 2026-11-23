# src/posture/prepareHumanFootHeight.ts#prepareHumanFootHeight

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed socket/body/toe inputs, default, changing placement and exact world-metre height result; articulated prepares body/socket geometry first and binds each actual toe angle for its unchanged-placement-height loop.

## @evidence contracts/development/implementation.md#principled-implementation

HumanFoot.offset and prepareOffset share the sole articulation owner; Quaternion.rotateVectorY evaluates exactly point's rotated Y expression, followed by the same ankle.y addition. The articulated companion preserves the same fixed-angle local offset across each actual ankle correction loop.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One socket-offset preparation precedes one scalar placement reader used by actual swinging-foot clearance loops. The articulated companion adds a fixed-geometry reader before that same offset/height boundary.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not normalize the placement rotation, omit toe articulation, reassociate the height expression or change any clearance sample/bound; it only omits unread X/Z outputs.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant preparation and scalar work per placement avoid full rotated/world point records and their unused X/Z output arithmetic across the original clearance passes. articulated additionally resolves body/socket geometry once for the swing, retaining actual toe trigonometry once for each angle's original correction loop.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The unchanged body, side, socket and toe flexion fix one local offset; every queried ankle and rotation is evaluated, and changing fixed inputs requires another reader. articulated binds one actual toe angle before its same-angle placement loop, without retaining or keying previous angles.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One caller-owned reader retains one local offset until its swing/action releases it. articulated retains only fixed body/socket geometry, and each actual toe angle's local offset releases with its synchronous correction read; neither reader stores placement, height, angle or time history.
