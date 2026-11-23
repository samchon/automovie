# src/motion/IAutoMovieFollowPathMotion.ts#IAutoMovieFollowPathMotion.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Waypoints are world metres projected onto XZ, requested speed is metres per second and turnWindow is metres. followPathMotion admits the path and gait before snapping duration to whole cycles; optional ground supplies world Y and defaults to zero.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieFollowPathMotion.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

Waypoints are world metres projected onto XZ, requested speed is metres per second and turnWindow is metres. followPathMotion admits the path and gait before snapping duration to whole cycles; optional ground supplies world Y and defaults to zero. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieFollowPathMotion.IProps contract belongs to interface; packages/engine/src/motion/followPathMotion.ts uses this boundary. Runtime computation remains with those consumers.
