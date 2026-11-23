# src/motion/readHingeRange.ts#readHingeRange

## @evidence contracts/development/common.md#meaningful-documentation

Defines radian output, clinical sign/offset recovery, exact current lower-domain range and unsupported reading refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The existing principal decomposition of pure hinge rotations at zero and one degree recovers its affine clinical sign/offset; inverse endpoints map the actual clinical flexion range back to the hinge's radians.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One owner supplies the identical range law to ordinary scoring and explicit orientation-root continuation, without duplicating range policy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the original length/slope admission and endpoint arithmetic; no ROM range, tolerance, name switch or assumed clinical sign is introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two constant-size principal reads and two endpoint conversions retain existing work; a matching workspace caches only the source-fixed range.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both search policies use this same actual source/domain/clinical mapping; the unchanged rig owner alone shares successful fixed-range work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns one fresh min/max record or null; temporary hinge/readings release on return or throw with no retained target, result history or handle.
