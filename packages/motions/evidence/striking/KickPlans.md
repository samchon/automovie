# src/striking/KickPlans.ts#KickPlans.create

## @evidence contracts/development/common.md#meaningful-documentation

States online correction ownership, launch-relative clocks and same-base optional hip sharing.

## @evidence contracts/development/implementation.md#principled-implementation

Builds each started correction's original whole contact/path plan, then superposes its minimum-jerk carriage and leg differences in observation order, retaining the original quaternion composition.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One started-plan owner serves carriage and leg evaluation; the caller supplies one current hip through all plans that hang from that exact base.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps every started observation, near-zero displacement rule, path evaluation, blend weight and transform order; no correction, physical plan or sample is skipped.

## @evidence contracts/development/implementation.md#efficient-algorithms

For C started corrections, retains O(C) blending and actual plan/path costs; one caller-read hip replaces repeated identical-base hip FK across these paths. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Started correction plans retain their existing observation-index ownership; only one explicit same-body/base hip value is borrowed by that call's paths, with no current pose or time-result cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Existing plans grow with the finite tracker observation count and end with the geometry; temporary started/leg records end each call and no supplied hip or body evaluation reader is retained.
