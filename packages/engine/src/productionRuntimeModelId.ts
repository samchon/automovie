/**
 * Compiler-owned runtime identity for one project model recipe.
 *
 * @author Samchon
 */
export const productionRuntimeModelId = (recipe: string): string =>
  `automovie:model:${recipe}`;
