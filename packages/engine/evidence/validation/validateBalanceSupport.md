# src/validation/validateBalanceSupport.ts#validateBalanceSupport

## @evidence contracts/development/implementation.md#principled-implementation

Sample FK within valid support windows, project a single-bone or weighted joint-position center onto XZ, and warn beyond the support hull plus margin.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared clock/FK/hull owners keep contact and balance samples consistent; malformed annotations are errors before sampling.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The mass table is a proximal-joint approximation, not measured whole-body anatomy; physicsIntent suppresses imbalance warnings but not malformed-window errors.

## @evidence contracts/development/common.md#meaningful-documentation

Default24Hz and20mm margin, optional center bone, reachable support requirement and advisory effects are explicit.

## @evidence contracts/development/implementation.md#efficient-algorithms

For W windows and T samples, motion/FK and contact hull costs dominate; each sample rebuilds the resolved map and weighted center.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Skeleton topology/reachability are computed once per invocation, then reused across windows.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Caller inputs are borrowed; per-sample maps/hulls release, while returned diagnostics grow with sampled failures and acquire no host handle.
