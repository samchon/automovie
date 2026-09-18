/**
 * Compiler-owned runtime identity for one project model recipe.
 *
 * @evidence requirements/actors/scope-and-identity.md#actor-identity-representation-lifetime Keeps the replaceable runtime model representation distinct from the longer-lived production actor identity.
 * @evidence specifications/performance-motion-and-staging/actor-identity-state-and-fidelity.md#performance-actor-story-performance-state Names the selected model representation independently of the story and production actor identities.
 * @author Samchon
 */
export const productionRuntimeModelId = (recipe: string): string =>
  `automovie:model:${recipe}`;
