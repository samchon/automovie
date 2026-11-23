# src/motion/prepareChainFit.ts#prepareChainFit

## @evidence contracts/development/implementation.md#principled-implementation

Separates target-independent FK/domains and last-record joint maps from target-specific analytic solving, using the same skeleton axis precedence and resolveBoneMap as the one-shot fit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

prepareChainFitRig owns rig/source preparation. This workspace separates actual source admission from authored-frame demand and owns continuity. Ordinary fitChainBend keeps search ordering; its shared hinge owner also serves explicit continuation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No search, tolerance, seed, callback result or constraint is approximated; lazy authored/reference reads retain the original order in which a degenerate analytic solve returns without reading them.

## @evidence contracts/development/implementation.md#efficient-algorithms

One geometry/domain preparation and lazy source/reference FK serve a workspace. A fixed source shares axes, geometry, source maps, articulation and prefix across goals. Explicit continuation's empty rig demand performs actual O(J) admission without unused authored ancestry/output, once per fixed source; raw callers keep full authored FK. Reference/continuity remain goal-local and all target solving remains. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The internal fixed workspace comes from identical immutable six source fields without goals. Successful actual admission is shared only in that lifetime; each binding owns references/weight/continuity. The rig producer certifies the original own data-method before real ordered admission; unknown/replaced/copied/proxied readers and raw/no-rig retain the authored path. Completion is set only after success, never from identity alone or caller flags. Ordinary lazy getters keep first-use order.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One workspace owns O(J+B) local maps/FK dependency snapshots and constant-size data for three chain bones, projector and fixed hinge/reference reads. It borrows fixed inputs and an optional same-operation reader until caller release and retains no target history, global cache, handle or task.

## @evidence contracts/development/common.md#meaningful-documentation

States the borrowed inputs, caller-owned lifetime and laziness that preserves degenerate-target admission order.
