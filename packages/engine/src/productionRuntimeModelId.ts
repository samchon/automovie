/** Compiler-owned runtime identity for one project model group. */
export const productionRuntimeModelId: (model: string) => string = (
  model: string,
): string => `automovie:model:${model}`;
