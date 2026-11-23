# src/geometry/sweep/IAutoMoviePoseSurfaceNetwork.ts#IAutoMoviePoseSurfaceNetwork.IProps

## @evidence contracts/development/design.md#principled-representation

Canonical resolved bones and rest geometry share model metres; separate name tables identify sweeps, free nodes, curves and ring pins. The poser checks named components and resolves required bones.

## @evidence contracts/development/design.md#minimal-and-owned-surface

poseAutoMovieSurfaceNetwork combines poseAutoMovieSweep with rigid transport of free geometry while preserving the canonical network topology and sampling counts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional tables mean no bindings for that category; sweep-attached nodes follow their sweep and are not given an additional rigid transform.

## @evidence contracts/development/common.md#meaningful-documentation

Gives binding categories, absence behavior, shared output components, bone-frame requirements and volume default.
