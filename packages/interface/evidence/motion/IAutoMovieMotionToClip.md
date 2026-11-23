# src/motion/IAutoMovieMotionToClip.ts#IAutoMovieMotionToClip.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Clinical motion, skeleton and optional axis/rest mappings share one rig; sampleRate is samples per second and nodePrefix qualifies both nodes and tracks. motionToClip admits positive sampling and matching rig data; scale and expressions are outside this lowering and between-sample rotation is approximate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieMotionToClip.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

Clinical motion, skeleton and optional axis/rest mappings share one rig; sampleRate is samples per second and nodePrefix qualifies both nodes and tracks. motionToClip admits positive sampling and matching rig data; scale and expressions are outside this lowering and between-sample rotation is approximate. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieMotionToClip.IProps contract belongs to interface; packages/engine/src/motion/motionToClip.ts uses this boundary. Runtime computation remains with those consumers.
