# src/pose/IAutoMovieClampPose.ts#IAutoMovieClampPose

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it clamps and what it returns.

## @evidence contracts/development/design.md#principled-representation

A callable projection with its one-joint clamp and angle-taking form as members, all of one unchanged rig.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The motions body keeps one (`IAutoMovieMotionHumanBody.projection`); the engine's clamp preparations build it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Rig readers only; every pose and joint is clamped afresh.

# src/pose/IAutoMovieClampPose.ts#IAutoMovieClampPose.IJoints

## @evidence contracts/development/common.md#meaningful-documentation

Documents IAutoMovieClampPose.IJoints: A one-joint clamp under a skeleton, with its angle-taking form.

## @evidence contracts/development/design.md#principled-representation

One record of its call, values over the canonical IAutoMovieJointPose, AutoMovieHumanoidBone contracts.

## @evidence contracts/development/design.md#minimal-and-owned-surface `clampPose.prepare` fills it and the enclosing IAutoMovieClampPose contract's readers use it; nothing else is declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with `clampPose.prepare`.

# src/pose/IAutoMovieClampPose.ts#IAutoMovieClampPose.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Documents IAutoMovieClampPose.IPrepared: A whole-pose projection with the one-joint clamp it maps.

## @evidence contracts/development/design.md#principled-representation

One record of its call, joints, values over the canonical IAutoMoviePose contracts.

## @evidence contracts/development/design.md#minimal-and-owned-surface `clampPose.prepare` fills it and the enclosing IAutoMovieClampPose contract's readers use it; nothing else is declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with `clampPose.prepare`.
