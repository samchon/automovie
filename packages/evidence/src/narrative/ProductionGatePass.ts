/**
 * Construction and expression revision have separate structural validation passes.
 *
 * @evidence contracts/common.md#principled-implementation The closed union distinguishes construction from independent naturalness, allowing dependency keys without treating authoring stages as approvals.
 * @evidence contracts/common.md#clear-and-simple-design Two literal names align dependency and review identities for construction and expression revision.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The names represent supported passes and do not make structural validation into creative approval.
 * @evidence contracts/common.md#meaningful-documentation The comment states separate structural validation for construction and expression revision.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Structural pass identity is erased at runtime; producing and consuming functions account for concrete traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Structural pass identity declares data and coordinates no reusable effects; consumers own equivalence and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Structural pass identity acquires no resource or retained state; concrete owners determine instance bytes and lifetimes.
 */
export type ProductionGatePass = "construction" | "naturalness";
