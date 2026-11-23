# src/motion/inertializePose.ts#inertializePose

## @evidence contracts/development/common.md#meaningful-documentation

States the rotation-space method, continuity/no-overshoot premises and contact-correction stage, plus optional codec sharing and the concrete codec's retained offset lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

Quintic inertialization (Bollo 2018) with every orientation offset decayed as a rotation vector, the standard treatment of orientation offsets.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Offsets are captured once; the returned function applies their decay before the target.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Bones present on one side only take their clinical neutral, zero, on the other.

## @evidence contracts/development/implementation.md#efficient-algorithms

Capture and each evaluation remain O(J) with all actual conversion/decay calls. A supplied codec avoids another O(B) setup; shared indexing and module decay/hinge helpers remove local mapper and per-hinge angle closures without caching outputs. Runtime speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Captured offsets and concrete codec serve the transition's existing retained lifetime; an explicit unchanged-rig getter can share codec construction with source/target velocity, while every time/target input still executes its actual decay and conversion.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The existing returned offset owns captured O(J) offsets, source rate data and one concrete codec with O(B) metadata. No getter, sample callback, per-time pose/result memo, task or global rig cache is added; the caller releases all retained state with the transition offset.
