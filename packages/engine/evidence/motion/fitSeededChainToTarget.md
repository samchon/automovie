# src/motion/fitSeededChainToTarget.ts#fitSeededChainToTarget

## @evidence contracts/development/implementation.md#principled-implementation

Prepares actual chain frames, solves two-bone candidates, clamps ROM and measures actual FK. prepareSource separates fixed geometry from live goal fields. Explicit continued first checks native two-axis orientation roots through actual FK, ROM and pole admission, then retains the existing near basin and physical bend gate or cold fallback. The curve's full goal/continuity admission remains mandatory, without claiming global cold-score identity.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

preparedWorkspace owns original fit/rotation and explicit continuation. continueHingedOrientation returns an actually oriented root result; unsupported roots retain shared near hinge admission and final orientation. Ordinary fitChainBend keeps its original pole/search order. Source geometry, actual admission and fixed clinical metadata keep their existing owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Failed bend admission preserves only the bend-stage source pose; requested orientation still applies afterward. No ideal target measurement replaces post-clamp FK. A 32-angle sweep and ten local halvings bound the heuristic, with 1e-12 continuity and 1e-6 normal-degeneracy thresholds.

## @evidence contracts/development/implementation.md#efficient-algorithms

Ordinary source work scales with rig/joints and fixed source bindings share its geometry/maps/prefix. Eligible explicit continuation replaces near's nested projection probes by at most two orientation-root trials with actual O(J) oriented outputs/FK. Unsupported cases retain near and cold work. Optional per-call events observe actual root trials/return and near/cold dispatch without global state; no latency gain is claimed before measurement.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Explicit immutable skeleton, pose, chain, topology and mappings prove source equivalence; source creation performs no FK and first binding retains ordinary preparation admission. Goal options are copied as only the seven supported changing fields, so they cannot replace source geometry. Each binding owns reference/weight/callback/near scope; omitted fields restore their original absent meanings. No solved pose, point, candidate score or seed is reused across targets or bindings.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A source producer owns one lazy O(J+B) base workspace until release; it retains no goal binding. Each bound workspace owns its own reference/continuity maps and borrows source data until caller release. Bounded search records end per target, and only caller-owned results escape. There are no global caches, handles or tasks.

## @evidence contracts/development/common.md#meaningful-documentation

States model-metre target, unchanged joints, actual ranking and bounded-search limits. Companion documentation defines prepare's fixed complete request and prepareSource's immutable source/live goal split, lazy first admission, exact authored-reader/static-rig premises, frames, omission behavior and caller-owned lifetimes.
