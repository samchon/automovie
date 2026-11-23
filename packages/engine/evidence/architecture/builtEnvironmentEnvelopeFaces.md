# src/architecture/builtEnvironmentEnvelopeFaces.ts#builtEnvironmentEnvelopeFaces

## @evidence contracts/development/implementation.md#principled-implementation

Places the outline and shoelace centroid with the face frame. Flips authored +Z only when the positive-offset centroid probe passes the space containment predicate; otherwise preserves it. This is a finite-distance orientation heuristic, not proof that the entire face borders the volume or points outward.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Composes the shared centroid, containment and building-owner queries, so this query owns only the exposure rule, the orientation probe and the aspect classification.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no boundary, space or building; the aspect threshold and probe distance are shared contract constants, and an unowned space is refused by the owner query rather than skipped.

## @evidence contracts/development/common.md#meaningful-documentation

States the exposure rule, every carried field, how the outward normal is chosen and when it is kept, the aspect rule and its constant, the sort order, and the throw for an unowned space.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds an O(S) space index and scans B boundaries. Each of D distinct exposed spaces pays a full owner lookup over S spaces, U building units and its ancestry depth. Adds summed outline vertices, one delegated containment probe per face and O(F log F) face sorting; containment cost depends on each space's volume representation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each space's owning building is resolved once per call and reused by every face of that space; nothing persists across calls because the record is the caller's.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The space index and owner memo live for one call, bounded by the space count; the caller owns the returned faces.
