


/** Lifecycle state of one structured production-local contract rule.
 *
 * @evidence contracts/common.md#principled-implementation Active, hold and rejected form the closed lifecycle of a structured contract rule.
 * @evidence contracts/common.md#clear-and-simple-design One union separates routing state from application timing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Held or rejected is not converted into executable active policy by this declaration.
 * @evidence contracts/common.md#meaningful-documentation The comment states lifecycle state for production-local structured routing.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural declaration selects no runtime algorithm; its producer owns parsing and traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type shares representation without coordinating completed or in-flight operations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased lifecycle string union acquires no state, handle or task; readAutoMovieContractRules creates the metadata records and transfers their lifetime to its caller.
 */
export type AutoMovieContractRuleStatus = "active" | "hold" | "rejected";
