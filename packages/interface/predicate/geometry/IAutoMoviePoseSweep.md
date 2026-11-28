# src/geometry/IAutoMoviePoseSweep.ts#IAutoMoviePoseSweep.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Rest sweep, authored bone binding and two resolved poses for rebuilding a sweep in model space.

## @evidence contracts/development/design.md#principled-representation

The operation moves spine controls with their bound bones and rotates each section using its one-bone motion or a two-bone spherical midpoint.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Bone resolution and rest geometry remain caller-owned. The returned sweep publishes moved controls and station rotations while sharing unchanged section data.

# src/geometry/IAutoMoviePoseSweep.ts#IAutoMoviePoseSweep.IProps.sweep

## @evidence contracts/development/common.md#meaningful-documentation

Rest sweep in the resolved bones' model metre frame. The output can share unchanged section, guide and feature records.

# src/geometry/IAutoMoviePoseSweep.ts#IAutoMoviePoseSweep.IProps.binding

## @evidence contracts/development/common.md#meaningful-documentation

Authored bone identities aligned with rest spine controls and stations. Station tuples choose one bone or a two-bone rotation midpoint.

# src/geometry/IAutoMoviePoseSweep.ts#IAutoMoviePoseSweep.IProps.rest

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed resolved rest transforms, identified by their bone IDs and expressed in model coordinates.

# src/geometry/IAutoMoviePoseSweep.ts#IAutoMoviePoseSweep.IProps.posed

## @evidence contracts/development/common.md#meaningful-documentation

Borrowed resolved current transforms in the same coordinate frame. Every referenced identity must resolve in both poses.

# src/geometry/IAutoMoviePoseSweep.ts#IAutoMoviePoseSweep.IProps.preserveVolume

## @evidence contracts/development/common.md#meaningful-documentation

True settles one joint-based scale factor against the authored rest volume for two-bone stations. Omission disables settlement.
