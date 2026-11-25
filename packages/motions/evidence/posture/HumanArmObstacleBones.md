# src/posture/HumanArmObstacleBones.ts#HumanArmObstacleBones

## @evidence contracts/development/common.md#meaningful-documentation

Defines the shared six-name TRUNK set, the trunk and whole-leg policy the audit reads, placed-arm membership and borrowed read-only names used by trunk filtering and obstacle FK demand.

## @evidence contracts/development/implementation.md#principled-implementation

Converts the existing clearance membership predicate into one canonical bone set, so scoped FK supplies exactly the same collider frames before actual placement/querying.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This owner supplies both the existing obstacle filter and its FK demand; TRUNK separately serves the trunk-only filter without duplicating the name table.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adds no collider, approximation, result, margin or contact policy; obstacle filtering still preserves original placed segment order.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two side labels select one of four fixed read-only sets in constant work, replacing repeated temporary arm-name sets.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Canonical membership depends only on the four possible placed-arm subsets, independent of body dimensions and current pose; actual geometry and queries remain current.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns four bounded static name sets and one trunk set, retaining no body, pose, shape or query history; callers borrow them without mutation.
