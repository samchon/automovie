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
 * @evidence contracts/development/design.md#principled-representation The closed draft/final spelling maps authoring selections to body versus naturalness trees; final is the expression revision, not a creative approval.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two legacy selector spellings keep root selection separate from the construction/naturalness gate vocabulary.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The alias does not certify creative completion; its final spelling is explicitly expression revision.
 * @evidence contracts/development/common.md#meaningful-documentation The prose defines draft/final roots, detached versus inline evidence and frozen comparison dependencies.
 */
export type AuthoredPass = "draft" | "final";
