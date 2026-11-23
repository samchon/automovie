# src/motion/composition/IAutoMovieEvaluateSchedule.ts#IAutoMovieEvaluateSchedule.IActive

## @evidence contracts/development/common.md#meaningful-documentation

The instant uses film seconds; active entries keep input entry order and carry local seconds and normalized phase in [0, 1). State values are borrowed from the latest ended entry, breaking equal-end ties by larger entry index.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieEvaluateSchedule.IActive keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

The instant uses film seconds; active entries keep input entry order and carry local seconds and normalized phase in [0, 1). State values are borrowed from the latest ended entry, breaking equal-end ties by larger entry index. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieEvaluateSchedule.IActive contract belongs to interface; packages/engine/src/composition/evaluateAutoMovieSchedule.ts uses this boundary. Runtime computation remains with those consumers.

# src/motion/composition/IAutoMovieEvaluateSchedule.ts#IAutoMovieEvaluateSchedule.IInstant

## @evidence contracts/development/common.md#meaningful-documentation

The instant uses film seconds; active entries keep input entry order and carry local seconds and normalized phase in [0, 1). State values are borrowed from the latest ended entry, breaking equal-end ties by larger entry index.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieEvaluateSchedule.IInstant keeps the operation's declared data fields separate from its implementation. The unknown state values belong to production-defined schedule state, which the engine only passes through.

## @evidence contracts/development/design.md#principled-representation

The instant uses film seconds; active entries keep input entry order and carry local seconds and normalized phase in [0, 1). State values are borrowed from the latest ended entry, breaking equal-end ties by larger entry index. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieEvaluateSchedule.IInstant contract belongs to interface; packages/engine/src/composition/evaluateAutoMovieSchedule.ts uses this boundary. Runtime computation remains with those consumers.
