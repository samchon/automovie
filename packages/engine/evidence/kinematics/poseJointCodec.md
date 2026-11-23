# src/kinematics/poseJointCodec.ts#poseJointCodec

## @evidence contracts/development/implementation.md#principled-implementation

The forward and inverse Euler maps of one convention, with the inverse's chart chosen by the joint's range, never an angle clamp.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One owner pairs the two maps with one set of tables; both bodies are single delegations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No bone is special-cased; a rotation no chart admits keeps its overshoot.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(B) axes merge and direct declared-range Map construction avoid B temporary entry tuples; conversions and mobility tests remain fixed work, with no per-test mobile closure. Explicit preparation shares construction across actual transition stages; runtime speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each codec shares indexed axes and LAST-declared constraint records, retaining existing live rest-frame/constraint reads. An explicit lazy owner can share that codec across source/target velocity and offset capture under one unchanged rig; no conversion result is memoized.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A codec owns one declared-range Map and optional merged axes table, borrowing rig records. A transition may retain that concrete codec for its existing offset lifetime; release the lazy getter after capture and the codec with that offset, with no global rig cache.

## @evidence contracts/development/common.md#meaningful-documentation

States why rotations are used, what each map delegates to and the no-rig reading.
