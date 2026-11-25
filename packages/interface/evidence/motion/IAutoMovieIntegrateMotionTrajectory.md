# src/motion/IAutoMovieIntegrateMotionTrajectory.ts#IAutoMovieIntegrateMotionTrajectory.IProps

## @evidence contracts/development/common.md#meaningful-documentation

The vector's components retain the caller's units and dx is their rate per second; optional quaternion orientation uses body-frame radians-per-second angular velocity. The integrator checks finite ordered times, positive step, usable state and rate dimensions, and finite nonnegative nonzero tolerance; readers hold the ends.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieIntegrateMotionTrajectory.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

The vector's components retain the caller's units and dx is their rate per second; optional quaternion orientation uses body-frame radians-per-second angular velocity. The integrator checks finite ordered times, positive step, usable state and rate dimensions, and finite nonnegative nonzero tolerance; readers hold the ends. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieIntegrateMotionTrajectory.IProps contract belongs to interface; packages/engine/src/motion/integrateMotionTrajectory.ts and packages/engine/src/motion/integrateAirborneRotation.ts use this boundary. Runtime computation remains with those consumers.

# src/motion/IAutoMovieIntegrateMotionTrajectory.ts#IAutoMovieIntegrateMotionTrajectory.ITolerance

## @evidence contracts/development/common.md#meaningful-documentation

The vector's components retain the caller's units and dx is their rate per second; optional quaternion orientation uses body-frame radians-per-second angular velocity. The integrator checks finite ordered times, positive step, usable state and rate dimensions, and finite nonnegative nonzero tolerance; readers hold the ends.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieIntegrateMotionTrajectory.ITolerance keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

The vector's components retain the caller's units and dx is their rate per second; optional quaternion orientation uses body-frame radians-per-second angular velocity. The integrator checks finite ordered times, positive step, usable state and rate dimensions, and finite nonnegative nonzero tolerance; readers hold the ends. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieIntegrateMotionTrajectory.ITolerance contract belongs to interface; packages/engine/src/motion/integrateMotionTrajectory.ts and packages/engine/src/motion/integrateAirborneRotation.ts use this boundary. Runtime computation remains with those consumers.

# src/motion/IAutoMovieIntegrateMotionTrajectory.ts#IAutoMovieIntegrateMotionTrajectory.IRate

## @evidence contracts/development/common.md#meaningful-documentation

The vector's components retain the caller's units and dx is their rate per second; optional quaternion orientation uses body-frame radians-per-second angular velocity. The integrator checks finite ordered times, positive step, usable state and rate dimensions, and finite nonnegative nonzero tolerance; readers hold the ends.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieIntegrateMotionTrajectory.IRate keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

The vector's components retain the caller's units and dx is their rate per second; optional quaternion orientation uses body-frame radians-per-second angular velocity. The integrator checks finite ordered times, positive step, usable state and rate dimensions, and finite nonnegative nonzero tolerance; readers hold the ends. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieIntegrateMotionTrajectory.IRate contract belongs to interface; packages/engine/src/motion/integrateMotionTrajectory.ts and packages/engine/src/motion/integrateAirborneRotation.ts use this boundary. Runtime computation remains with those consumers.

# src/motion/IAutoMovieIntegrateMotionTrajectory.ts#IAutoMovieIntegrateMotionTrajectory.IState

## @evidence contracts/development/common.md#meaningful-documentation

The vector's components retain the caller's units and dx is their rate per second; optional quaternion orientation uses body-frame radians-per-second angular velocity. The integrator checks finite ordered times, positive step, usable state and rate dimensions, and finite nonnegative nonzero tolerance; readers hold the ends.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieIntegrateMotionTrajectory.IState keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

The vector's components retain the caller's units and dx is their rate per second; optional quaternion orientation uses body-frame radians-per-second angular velocity. The integrator checks finite ordered times, positive step, usable state and rate dimensions, and finite nonnegative nonzero tolerance; readers hold the ends. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieIntegrateMotionTrajectory.IState contract belongs to interface; packages/engine/src/motion/integrateMotionTrajectory.ts and packages/engine/src/motion/integrateAirborneRotation.ts use this boundary. Runtime computation remains with those consumers.

# src/motion/IAutoMovieIntegrateMotionTrajectory.ts#IAutoMovieIntegrateMotionTrajectory.ITrajectory

## @evidence contracts/development/common.md#meaningful-documentation

The vector's components retain the caller's units and dx is their rate per second; optional quaternion orientation uses body-frame radians-per-second angular velocity. The integrator checks finite ordered times, positive step, usable state and rate dimensions, and finite nonnegative nonzero tolerance; readers hold the ends.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieIntegrateMotionTrajectory.ITrajectory keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

The vector's components retain the caller's units and dx is their rate per second; optional quaternion orientation uses body-frame radians-per-second angular velocity. The integrator checks finite ordered times, positive step, usable state and rate dimensions, and finite nonnegative nonzero tolerance; readers hold the ends. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieIntegrateMotionTrajectory.ITrajectory contract belongs to interface; packages/engine/src/motion/integrateMotionTrajectory.ts and packages/engine/src/motion/integrateAirborneRotation.ts use this boundary. Runtime computation remains with those consumers.
