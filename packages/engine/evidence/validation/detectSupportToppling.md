# src/validation/detectSupportToppling.ts#detectSupportToppling

## @evidence contracts/development/implementation.md#principled-implementation

Nonempty support and finite nonnegative margin precede canonical convex-hull distance and nearest-edge projection; the overhang direction and excess distance become a time-zero fall event and optional pivot suggestion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Hull, segment projection and vector normalization stay with their shared math owners while this adapter joins warning, event and suggestion from one support decision.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No contact geometry is invented for empty support; physicsIntent suppresses warning/suggestion but keeps the event. Finite representable input geometry remains a caller premise and point support does not prove dynamic stability.

## @evidence contracts/development/common.md#meaningful-documentation

States world-frame support/center, default .02m allowance, exact supported boundary, borrowed pivot endpoints, fresh event point and uninstalled motion-synthesis scope.

## @evidence contracts/development/implementation.md#efficient-algorithms

For S support points, hull construction costs O(S log S) and distance/nearest-edge scans O(S), with O(S) hull storage and fixed result/event allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One prepared hull serves distance and pivot queries, and one nearest point supplies event and fall direction; no stale support verdict is cached across mutable inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Fresh findings/event/direction transfer to the caller while pivot endpoints borrow support records; no support population is otherwise retained and no physics task is acquired.
