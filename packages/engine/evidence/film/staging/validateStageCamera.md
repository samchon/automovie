# src/film/staging/validateStageCamera.ts#validateStageCamera

## @evidence contracts/development/implementation.md#principled-implementation

Checks only what composition and later stages cannot use: a finite position, a field of view strictly inside `(0, 180)` degrees, `0 < near < far`, a resolvable finite target and a look direction long enough to define the level-horizon basis `lookRotation` builds; the direction is derived once from the same table `performShot` resolves positional targets against.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Extracted from `stageScene` as the camera family's validator, beside the light and set-piece checks; it delegates depth precision and the clearance envelope to their own validators and leaves id uniqueness to the scene-wide claim in `stageScene`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No camera or target is special-cased; the 1e-9 m look epsilon refuses only a target on the camera itself, where the look axis is undefined, and geometry is not judged beyond that.

## @evidence contracts/development/common.md#meaningful-documentation

States every check with its bound and unit, the delegated validators, the reported paths, what is left to the caller, and when a direction is returned.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A fixed number of field checks and one map lookup per camera, plus the delegated validators' cost.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The returned direction is the one `stageScene` composes the camera's rotation from, so the aim is derived once for validation and composition.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing itself; it appends violations to the caller's collector and returns one new vector or nothing.
