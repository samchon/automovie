# src/motion/IAutoMovieMinimumJerk.ts#IAutoMovieMinimumJerk.IProfile

## @evidence contracts/development/common.md#meaningful-documentation

The profile stores dimensionless progress and its first two derivatives with respect to normalized time. minimumJerk admits finite time, holds progress at 0 or 1 outside the unit interval and returns zero derivatives there; conversion to seconds requires duration and its square.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

IAutoMovieMinimumJerk.IProfile keeps the operation's declared data fields separate from its implementation. The declared structural types do not certify the documented numerical or semantic preconditions.

## @evidence contracts/development/design.md#principled-representation

The profile stores dimensionless progress and its first two derivatives with respect to normalized time. minimumJerk admits finite time, holds progress at 0 or 1 outside the unit interval and returns zero derivatives there; conversion to seconds requires duration and its square. Required members and referenced canonical contracts establish the structural shape; numeric and cross-field constraints remain runtime obligations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieMinimumJerk.IProfile contract belongs to interface; packages/engine/src/motion/minimumJerk.ts and packages/engine/src/motion/superposeMinimumJerk.ts use this boundary. Runtime computation remains with those consumers.
