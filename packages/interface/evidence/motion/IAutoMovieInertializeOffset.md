# src/motion/IAutoMovieInertializeOffset.ts#IAutoMovieInertializeOffset.IState

## @evidence contracts/development/common.md#meaningful-documentation

The value keeps the caller's channel unit, velocity is that unit per second and duration is the effective decay in seconds. inertializeOffset checks finite inputs and a positive requested duration, may shorten it to prevent overshoot, and returns zero value and velocity after decay.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieInertializeOffset.IState keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

The value keeps the caller's channel unit, velocity is that unit per second and duration is the effective decay in seconds. inertializeOffset checks finite inputs and a positive requested duration, may shorten it to prevent overshoot, and returns zero value and velocity after decay. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieInertializeOffset.IState contract belongs to interface; packages/engine/src/motion/inertializeOffset.ts uses this boundary. Runtime computation remains with those consumers.
