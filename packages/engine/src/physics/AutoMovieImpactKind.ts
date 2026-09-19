/**
 * How a collision resolves: the qualitative outcome.
 *
 * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Names the authored-facing consequence of a contact.
 * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Classifies the resolved contact output for downstream reaction.
 */
export type AutoMovieImpactKind = "bounce" | "embed" | "through" | "deflect";
