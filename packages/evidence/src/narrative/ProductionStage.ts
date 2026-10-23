/**
 * Authoring stages select claims; independent readers decide creative completion.
 *
 * @evidence contracts/common.md#principled-implementation The two literal stages express enabled structural evidence versus disabled duties, leaving completion to independent review.
 * @evidence contracts/common.md#clear-and-simple-design The two literals express participation without mixing authoring status and approval.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Disabled is declared configuration rather than a diagnostic fallback; independent readers own completion.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes claim selection from independent creative completion.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Evidence activation stage is erased at runtime; producing and consuming functions account for concrete traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Evidence activation stage declares data and coordinates no reusable effects; consumers own equivalence and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Evidence activation stage acquires no resource or retained state; concrete owners determine instance bytes and lifetimes.
 */
export type ProductionStage = "disabled" | "evidence";
