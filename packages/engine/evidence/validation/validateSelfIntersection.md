# src/validation/validateSelfIntersection.ts#validateSelfIntersection

## @evidence contracts/development/implementation.md#principled-implementation

Sample valid capsule pairs through FK and warn when segment distance is less than summed radii.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared sample clock, segmentSegmentDistance and validateCapsule own temporal, distance and endpoint semantics.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Capsule proxies approximate bodies; tangency is allowed and physicsIntent suppresses overlap warnings while malformed inputs stay errors.

## @evidence contracts/development/common.md#meaningful-documentation

Default24Hz, proxy/model units and pair/sample paths are stated.

## @evidence contracts/development/implementation.md#efficient-algorithms

For P pairs and T samples, repeated motion/FK work and segment tests dominate; this coordinator resolves each pair's sampled pose independently.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Skeleton topology/reachability are reused; pair endpoints share the same canonical capsule admission.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Sample-local resolved maps release; returned diagnostics grow with failures and no native collision world persists.
