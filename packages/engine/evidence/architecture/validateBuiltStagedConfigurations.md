# src/architecture/validateBuiltStagedConfigurations.ts#validateBuiltStagedConfigurations

## @evidence contracts/development/implementation.md#principled-implementation

TRS requires orthogonal scaled basis columns, tested by decomposition and recomposition with linear-basis error bounded by 1e-8 times max(1, largest absolute basis entry). Every named state combination affecting one element is checked; translation is excluded from the error scale, tiny bases retain the absolute tolerance floor, and non-finite matrices are refused.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One staged check separated from `validateBuiltEnvironment`; staging and subtree walks come from their shared owners instead of the private staging and fixed-point descendant copies the validator kept.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No element, door or run is special-cased; shear is refused rather than decomposed away, and a state is reported once because its author fixes one hierarchy.

## @evidence contracts/development/common.md#meaningful-documentation

States current-state paths, alternative subtree checks, interacting named-state combinations, independent-branch separation, translation-independent tolerance and non-finite refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each current, individual-alternative or combined assignment pays full world-staging cost W, including elements, operating members, states and selected values, then relevant element checks. Subtree construction and O(E*O) operation-membership grouping precede Cartesian searches. Worst-case assignment count is exponential in interacting operations; disjoint influence groups do not multiply each other's states.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Elements with the same influencing operation indexes share one combination walk and staging per assignment. Assignments differing from current in at most one member reuse the earlier checks by skipping; no staging survives the call because the environment is mutable.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Operation subtrees and element groups are bounded by operation-count times element-count; one matrix map and one state assignment live per combination, with recursion depth bounded by interacting operations. Findings grow with rejected combinations and have no separate cap.
