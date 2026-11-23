# src/geometry/sweep/preserveAutoMovieSweepVolume.ts#preserveAutoMovieSweepVolume

## @evidence contracts/development/implementation.md#principled-implementation

The pose-invariant section moments and posed flux integral used by the existing sweep-volume operator, with the shared secant method settling the same authored rest-volume target.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the volume buffers and scale profile separately from the sweep's frame registration, bone resweep and girth setter.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the existing quadrature, spline, secant and girth ordering unchanged; no fixture, geometry or consumer case is introduced.

## @evidence contracts/development/common.md#meaningful-documentation

States the target's scope, caller update order, in-place result and shared buffer ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Compile uses 400 by 256 section-profile queries and 801 rest planes plus O(K) knot preparation for K combined scale/station knots. Each pose reads 801 planes and at most ten volume trials; a trial fits the K-knot spline and sums 400 volume samples. It allocates nothing per pose.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Section moments, authored rest target and knot layout are immutable per compiled sweep and computed once. The returned writer reads the current shared orientation and current girth multipliers on each pose, so it never reuses an old pose's scale output.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The owning rig retains 1200 moment numbers, 801 packed planes, 400 midpoint scales and O(K) profile/work arrays with this closure. One additional scale-slot-sized staging buffer prevents partial scale publication on refusal. The supplied scale/girth buffers and orientation are shared with that same rig and released with it; caller registration is sealed before these references are captured.
