# src/motion/IAutoMovieMotionClipBridge.ts#IAutoMovieMotionClipBridge

## @evidence contracts/development/design.md#principled-representation

Couples the skeleton's lowered node hierarchy with channels targeting those same prefixed ids, carrying full local bone rotations because general clip overrides replace node rotation rather than add articulation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Nodes and clip travel together so sceneToNodes can instantiate one actor subtree and apply the matching sampled channels without a renderer-specific humanoid model.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Lowered bone scales follow resolvePose's unit-scale convention, and unsupported expression channels are documented as absent rather than fabricated morph weights.

## @evidence contracts/development/common.md#meaningful-documentation

States complete local rotations, root tracks, omitted expressions, bake-time parity and the target-node hierarchy relationship.
