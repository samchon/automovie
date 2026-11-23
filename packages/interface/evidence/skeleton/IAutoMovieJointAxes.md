# src/skeleton/IAutoMovieJointAxes.ts#IAutoMovieJointAxes

## @evidence contracts/development/design.md#principled-representation

An orthogonal basis per bone in which `jointToQuaternion` composes three axis-angle rotations and `decomposeJointRotation` inverts them by projecting onto the same axes, which is exact only for an orthogonal basis; the validators enforce that premise and the decomposer corrects a left-handed triple's twist sign.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three direction vectors and the composition order in one record per bone, so a rig overrides only the bones whose frames differ, on the bone or in a host table, and every composer and inverse reads the same declaration.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A skewed or degenerate basis is refused rather than orthogonalized, so a malformed declaration cannot silently change which motion an angle names.

## @evidence contracts/development/common.md#meaningful-documentation

States why a rig declares axes, where it declares them and the precedence over a host table, the frame and normalization of each axis, the orthogonality tolerance and the refusal paths, the defaults, and the composition order with its default.
