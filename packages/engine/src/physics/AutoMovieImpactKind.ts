/**
 * Qualitative outcome of resolveImpact's deterministic collision heuristic: bounce, embed, through or deflect. These values describe advice, not a full contact simulation or material fracture proof.
 *
 * @evidence contracts/common.md#principled-implementation The closed union matches resolveImpact's separating-contact, restitution/hardness, penetrability and speed branches so consumers can exhaustively interpret current advice.
 * @evidence contracts/common.md#clear-and-simple-design One shared vocabulary connects impact results, collision proposals and warnings without a runtime enum object.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Embed and through are heuristic classifications at fixed speed/material thresholds, with no body- or fixture-specific outcome override.
 * @evidence contracts/common.md#meaningful-documentation Documents that the four outcomes belong to advisory collision classification rather than physically exact simulation.
 * @evidence contracts/performance.md#efficient-algorithms The union has no runtime algorithm or allocation; branch costs belong to resolveImpact.
 * @evidence contracts/performance.md#reuse-equivalent-work The same type is referenced by impact producers and consumers; there is no duplicated classification cache or computation here.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The type owns no retained state, task or resource and erases at runtime.
 */
export type AutoMovieImpactKind = "bounce" | "embed" | "through" | "deflect";
