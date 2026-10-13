/**
 * A request that arrived before the resident page reported its renderer.
 * The server answers 503; the caller decides when to ask again. This refusal
 * establishes neither process death nor permission to replace the browser.
 *
 * @evidence contracts/common.md#principled-implementation Distinguishes unfinished renderer startup from an actual failed or exited service.
 * @evidence contracts/common.md#clear-and-simple-design A dedicated Error subtype supplies startup classification independently of transport wording.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries absent readiness without manufacturing a display, claiming process death or scheduling an age-based restart.
 * @evidence contracts/common.md#meaningful-documentation States the HTTP refusal, caller-owned subsequent request and lack of termination authority.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Distinguishes unfinished renderer startup from an actual failed or exited service.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view A dedicated Error subtype supplies startup classification independently of transport wording.
 */
export class HumanViewerStartingError extends Error {}
