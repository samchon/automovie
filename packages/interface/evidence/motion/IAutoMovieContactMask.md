# src/motion/IAutoMovieContactMask.ts#IAutoMovieContactMask.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Resolved effector positions and ground heights share model-frame metres; tolerance is finite nonnegative metres. contactMask rejects nonfinite ground, propagates callback errors and reports false for a missing effector.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieContactMask.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

Resolved effector positions and ground heights share model-frame metres; tolerance is finite nonnegative metres. contactMask rejects nonfinite ground, propagates callback errors and reports false for a missing effector. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieContactMask.IProps contract belongs to interface; packages/engine/src/motion/contactMask.ts uses this boundary. Runtime computation remains with those consumers.
