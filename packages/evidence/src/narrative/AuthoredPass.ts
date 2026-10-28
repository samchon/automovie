/**
 * Names the two logical authored passes of one shared manuscript.
 *
 * `draft` means construction. `final` means screenplay naturalness. They select
 * `docs/body` and `docs/naturalness` respectively; construction evidence is detached,
 * while naturalness evidence stays inline in the working text.
 *
 * Naturalness compares its working text with the frozen construction snapshot
 * in `docs/revision`. The source flag chooses upstream approval dependencies.
 *
 * @evidence contracts/common.md#principled-implementation The closed draft/final spelling maps authoring selections to body versus naturalness trees; final is the expression revision, not a creative approval.
 * @evidence contracts/common.md#clear-and-simple-design Two legacy selector spellings keep root selection separate from the construction/naturalness gate vocabulary.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The alias does not certify creative completion; its final spelling is explicitly expression revision.
 * @evidence contracts/common.md#meaningful-documentation The prose defines draft/final roots, detached versus inline evidence and frozen comparison dependencies.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Logical authored pass is an erased TypeScript shape, so it selects no runtime algorithm; its producing and consuming functions account for concrete traversal and allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Logical authored pass declares data only and coordinates no requests or reusable effects; consumers own equivalence and invalidation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Logical authored pass acquires no resource or retained state; concrete object owners, not this erased declaration, determine retained bytes and lifetimes.
 */
export type AuthoredPass = "draft" | "final";
