/**
 * Compiler-owned skeleton identity for one rigged project model recipe.
 *
 * @evidence requirements/actors/scope-and-identity.md#actor-identity-representation-lifetime Keeps a runtime rig representation replaceable without changing the owning production actor identity.
 * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-story-performance-state Names the selected skeleton binding independently of the story and production actor identities.
 * @author Samchon
 */
export const productionRuntimeSkeletonId = (recipe: string): string =>
  `automovie:skeleton:${recipe}`;
