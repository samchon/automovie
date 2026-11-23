# src/motion/IAutoMovieFollowPathMotion.ts#IAutoMovieFollowPathMotion

## @evidence contracts/development/common.md#meaningful-documentation

Waypoints are world metres projected onto XZ, requested speed is metres per second and turnWindow is metres. followPathMotion admits the path and gait before snapping duration to whole cycles; optional ground supplies world Y and defaults to zero.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This namespace groups the IAutoMovieFollowPathMotion contracts used by packages/engine/src/motion/followPathMotion.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.

## @evidence contracts/development/design.md#principled-representation

Waypoints are world metres projected onto XZ, requested speed is metres per second and turnWindow is metres. followPathMotion admits the path and gait before snapping duration to whole cycles; optional ground supplies world Y and defaults to zero. The namespace groups these type contracts without implementing the operation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieFollowPathMotion contract belongs to interface; packages/engine/src/motion/followPathMotion.ts uses its nested records and callbacks. Runtime computation remains with those consumers.

# src/motion/IAutoMovieFollowPathMotion.ts#IAutoMovieFollowPathMotion.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Waypoints are world metres projected onto XZ, requested speed is metres per second and turnWindow is metres. followPathMotion admits the path and gait before snapping duration to whole cycles; optional ground supplies world Y and defaults to zero.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieFollowPathMotion.IProps keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

Waypoints are world metres projected onto XZ, requested speed is metres per second and turnWindow is metres. followPathMotion admits the path and gait before snapping duration to whole cycles; optional ground supplies world Y and defaults to zero. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieFollowPathMotion.IProps contract belongs to interface; packages/engine/src/motion/followPathMotion.ts uses this boundary. Runtime computation remains with those consumers.
