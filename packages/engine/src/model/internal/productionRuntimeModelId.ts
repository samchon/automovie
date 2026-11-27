/*
 * Compiler-owned runtime identity for one project model group.
 */
export function productionRuntimeModelId(model: string): string {
  return `automovie:model:${model}`;
}
