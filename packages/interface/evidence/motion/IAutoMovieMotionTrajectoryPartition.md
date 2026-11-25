# src/motion/IAutoMovieMotionTrajectoryPartition.ts#IAutoMovieMotionTrajectoryPartition.IPartition

## @evidence contracts/development/common.md#meaningful-documentation

Documents IAutoMovieMotionTrajectoryPartition.IPartition: Numeric interval ownership, with all times in seconds.

## @evidence contracts/development/design.md#principled-representation

One record of end, split, clear.

## @evidence contracts/development/design.md#minimal-and-owned-surface `MotionTrajectoryPartition` fills it and the enclosing IAutoMovieMotionTrajectoryPartition contract's readers use it; nothing else is declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with `MotionTrajectoryPartition`.
