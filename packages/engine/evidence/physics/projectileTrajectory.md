# src/physics/projectileTrajectory.ts#projectileTrajectory

## @evidence contracts/development/implementation.md#principled-implementation

Sample constant-acceleration states at i*duration/round(duration*fps), including both endpoints; aimRotation aligns +Z to velocity. Requested fps is approximate after rounding, and linear clip interpolation approximates the continuous parabola.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The producer writes clip buffers directly and delegates state and facing mathematics to their existing owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The minimum one interval is an explicit sampling rule; no expected impact time is inserted. Very large finite duration*fps still requires a representable, allocatable frame count from callers.

## @evidence contracts/development/common.md#meaningful-documentation

Docs give seconds/fps inputs, position and quaternion tracks, endpoint inclusion and invalid-quantity throws; consumers own the returned clip buffers.

## @evidence contracts/development/implementation.md#efficient-algorithms

F intervals require O(F) state/facing work and O(F) time, translation and rotation output storage; no constant-memory claim applies to the clip.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The sampled state serves both translation and facing at each frame; no result is cached across mutable projectile or sample-clock inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocated clip arrays transfer to the caller on success; no native handle or background sampler survives failure or completion.
