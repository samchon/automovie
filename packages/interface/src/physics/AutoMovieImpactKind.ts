/**
 * Qualitative outcome of resolveImpact's deterministic collision heuristic:
 * bounce, embed, through or deflect. These values describe advice, not a full
 * contact simulation or material fracture proof.
 */
export type AutoMovieImpactKind = "bounce" | "embed" | "through" | "deflect";
