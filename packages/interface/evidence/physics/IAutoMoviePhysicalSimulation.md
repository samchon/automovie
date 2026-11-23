# src/physics/IAutoMoviePhysicalSimulation.ts#IAutoMoviePhysicalSimulation

## @evidence contracts/development/design.md#principled-representation

Sampled inputs establish content identity and checkpoint equivalence; cache stores the corresponding completed frames and restart snapshots.

## @evidence contracts/development/design.md#minimal-and-owned-surface

These four public constructor properties and trackingAt are the observable instance surface used by checkpoint, playback and tracking consumers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No native World or RigidBody handle escapes through this record; checkpoint bytes remain opaque to callers.

## @evidence contracts/development/common.md#meaningful-documentation

Defines completed publication, owned defaults, replay lifetime, work count and diagnostic sampling semantics.
