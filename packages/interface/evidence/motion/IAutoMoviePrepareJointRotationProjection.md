# src/motion/IAutoMoviePrepareJointRotationProjection.ts#IAutoMoviePrepareJointRotationProjection

## @evidence contracts/development/common.md#meaningful-documentation

Each call states its local rotation input and its clinical joint or paired quaternion result.

## @evidence contracts/development/design.md#principled-representation

A callable projector with its paired reader and optional swivel proposer, and the paired result record.

## @evidence contracts/development/design.md#minimal-and-owned-surface `prepareJointRotationProjection` produces it; chain fits and distal twist solves read it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every projection is computed afresh; proposals still need the actual clamp and checks.

# src/motion/IAutoMoviePrepareJointRotationProjection.ts#IAutoMoviePrepareJointRotationProjection.IProjector

## @evidence contracts/development/common.md#meaningful-documentation

Documents IAutoMoviePrepareJointRotationProjection.IProjector: The original callable plus an explicit paired-result read.

## @evidence contracts/development/design.md#principled-representation

One record of its call, withQuaternion, swivelCandidates over the canonical IAutoMovieQuaternion, IAutoMovieJointPose, IAutoMoviePrepareJointRotationCoefficientDots contracts.

## @evidence contracts/development/design.md#minimal-and-owned-surface `prepareJointRotationProjection` fills it and the enclosing IAutoMoviePrepareJointRotationProjection contract's readers use it; nothing else is declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with `prepareJointRotationProjection`.

# src/motion/IAutoMoviePrepareJointRotationProjection.ts#IAutoMoviePrepareJointRotationProjection.IProjection

## @evidence contracts/development/common.md#meaningful-documentation

Documents IAutoMoviePrepareJointRotationProjection.IProjection: Fresh result wrapper and raw quaternion of one query, with the callable's joint ownership.

## @evidence contracts/development/design.md#principled-representation

One record of joint, quaternion over the canonical IAutoMovieJointPose, IAutoMovieQuaternion contracts.

## @evidence contracts/development/design.md#minimal-and-owned-surface `prepareJointRotationProjection` fills it and the enclosing IAutoMoviePrepareJointRotationProjection contract's readers use it; nothing else is declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with `prepareJointRotationProjection`.
