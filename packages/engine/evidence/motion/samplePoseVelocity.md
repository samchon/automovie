# src/motion/samplePoseVelocity.ts#samplePoseVelocity

## @evidence contracts/development/implementation.md#principled-implementation

Second-order central and one-sided differences on the source function; angular velocity by the quaternion log map.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three samples, then one weighted difference per channel.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A non-positive step throws; a one-sided motion is never sampled across its instant.

## @evidence contracts/development/implementation.md#efficient-algorithms

All original sample callbacks and O(J) indexing/conversions/differences remain; a supplied codec avoids another O(B) setup and module helpers avoid per-bone spin/per-call mapper closures. Every forward rotation still executes; runtime speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One explicit unchanged-rig codec may serve related source/target velocity and offset capture, but no sampled pose, angle rate or articulation result is cached. Fresh pose indexing shares one owner with inertialization.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned state owns its existing pose/rate maps and vectors, with no callback, codec or lazy getter added. A borrowed codec/source remains parent-owned; local samples/indexes end with this call and no global rig cache is consulted.

## @evidence contracts/development/common.md#meaningful-documentation

States both estimators, their sample/order/error premises, absent-angle meaning and units, plus the optional same-rig codec's post-samples demand stage.
