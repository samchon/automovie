# src/core/IAutoMovieDriver.ts#IAutoMovieDriver

## @evidence contracts/development/design.md#principled-representation `resolveDrivers` partitions by `type`, orders copy and driven drivers by a depth-first topological sort over the channel keys they read and write, and `resolveWorldDrivers` then applies aim, parent and solvable IK in list order on composed world matrices, deferring the rest.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A six-member union discriminated on `type`, where each member carries only its own solve's inputs and the pass a driver runs in follows from its type rather than from a flag.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Supported world/stateful descriptors that this pass does not execute remain deferred; unknown driver types and reciprocal value-driver cycles throw. A driver's own input/output identity is excluded from dependency edges under the existing one-step policy.

## @evidence contracts/development/common.md#meaningful-documentation

States the two passes and their order relative to limits and composition, the profile-first ordering, which drivers are deferred and when, the throws, and why limits are not drivers.
