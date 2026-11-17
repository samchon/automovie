/**
 * Qualitative outcome of resolveImpact's deterministic collision heuristic: bounce, embed, through or deflect. These values describe advice, not a full contact simulation or material fracture proof.
 *
 * @evidence contracts/development/design.md#principled-representation The closed union matches resolveImpact's separating-contact, restitution/hardness, penetrability and speed branches so consumers can exhaustively interpret current advice.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One shared vocabulary connects impact results, collision proposals and warnings without a runtime enum object.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Embed and through are heuristic classifications at fixed speed/material thresholds, with no body- or fixture-specific outcome override.
 * @evidence contracts/development/common.md#meaningful-documentation Documents that the four outcomes belong to advisory collision classification rather than physically exact simulation.
 */
export type AutoMovieImpactKind = "bounce" | "embed" | "through" | "deflect";
