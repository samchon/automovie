/**
 * Authoring stages select claims; independent readers decide creative completion.
 *
 * @evidence contracts/development/design.md#principled-representation The two literal stages express enabled structural evidence versus disabled duties, leaving completion to independent review.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two literals express participation without mixing authoring status and approval.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Disabled is declared configuration rather than a diagnostic fallback; independent readers own completion.
 * @evidence contracts/development/common.md#meaningful-documentation The comment distinguishes claim selection from independent creative completion.
 */
export type ProductionStage = "disabled" | "evidence";
