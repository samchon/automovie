# src/math/createMeshPhysicalPartitionMatcher.ts#createMeshPhysicalPartitionMatcher

## @evidence contracts/development/implementation.md#principled-implementation

Captured connectivity, physical ordinals, explicit source labels and degenerate-face ordinals determine topology reuse; moved coordinates are equivalent only while those facts remain unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared triangle admission, physical identity and welding own component checks; this matcher combines their captured facts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Malformed candidates return false for ordinary validation, and changed source domains cannot hide behind unchanged incidence labels.

## @evidence contracts/development/common.md#meaningful-documentation

States captured facts, allowed coordinate/table changes, copied expectations and geometry properties the match does not certify.

## @evidence contracts/development/implementation.md#efficient-algorithms

For V vertices and T triangles, capture and comparison cost O(V plus T), using linear weld maps and copied arrays.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Expected connectivity and partitions are captured once for many candidates; equivalence includes source meaning and degenerate-face population rather than absolute positions.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The closure retains copied expected arrays; candidate maps are released after comparison, and releasing the closure releases its linear-size expectation.
