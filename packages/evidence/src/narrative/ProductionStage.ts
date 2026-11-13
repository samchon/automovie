/**
 * Authoring stages select claims; independent readers decide creative completion.
 *
 * `evidence` checks a pass's claims. `disabled` is a pass not yet run and
 * `completed` a pass that ran and closed; both stop those checks, so a change
 * after closure, such as the expression transfer, leaves no stale answer or
 * review to refresh. Where running matters, `completed` counts as run: a layer
 * or outline outside the production route stays `disabled`, and a completed
 * layer keeps its discovery claim, whose hosts are work contracts every layer
 * shares.
 *
 * @evidence contracts/development/design.md#principled-representation The three literal stages express a pass not yet run, a pass under structural evidence and a closed pass, leaving completion to independent review.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The literals express participation without mixing authoring status and approval; `completed` gates the pass's claims like `disabled` and differs only where a run matters: the source check refuses it for a layer or outline the route never runs, and the discovery claim, whose hosts all layers share, stays active.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Disabled and completed are declared configuration rather than diagnostic fallbacks; completed records a closure without granting it, and independent readers own completion.
 * @evidence contracts/development/common.md#meaningful-documentation The comment distinguishes claim selection from independent creative completion, states what each stage checks and where completed differs from disabled.
 */
export type ProductionStage = "disabled" | "evidence" | "completed";
