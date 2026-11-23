# src/physics/IAutoMovieMotionGeometry.ts#IAutoMovieMotionGeometry

## @evidence contracts/development/design.md#principled-representation

Separate carrier, joint and material collections express geometric contact and range measurements without pretending that observed frames form a massive native body.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Motion auditing reuses physical shape and rigid-frame contracts but excludes inertia, motors and friction that its geometric measurements do not read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Disconnected geometry needs no invented joints, and extra witness frames do not acquire a collider or mass merely by being named.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies admission, geometric units, disconnected-carrier meaning and empty or absent collection behavior.
