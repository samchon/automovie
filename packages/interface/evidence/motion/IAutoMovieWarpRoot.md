# src/motion/IAutoMovieWarpRoot.ts#IAutoMovieWarpRoot.IWarp

## @evidence contracts/development/common.md#meaningful-documentation

Translation is metres in the root's parent frame and yaw is degrees about that frame's +Y; start and end share the sample's seconds clock. warpRoot requires end after start, holds the full displacement after the window and preserves source scale.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieWarpRoot.IWarp keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

Translation is metres in the root's parent frame and yaw is degrees about that frame's +Y; start and end share the sample's seconds clock. warpRoot requires end after start, holds the full displacement after the window and preserves source scale. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieWarpRoot.IWarp contract belongs to interface; packages/engine/src/motion/warpRoot.ts uses this boundary. Runtime computation remains with those consumers.
