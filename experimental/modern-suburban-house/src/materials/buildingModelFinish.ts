/**
 * Building model face binding. The model id qualifies reused face names such as
 * leaf-panel: the front leaf, garage panel, and yard gate have different
 * finishes. Every emitted part must resolve to exactly one authored finish.
 */
import type { HouseFinish } from "./HouseFinish";
import { buildingFinishes } from "./buildingFinishes";

/** Resolve an emitted model face, refusing omissions and ambiguous bindings. */
export const buildingModelFinish = (
  modelId: string,
  faceId: string,
): HouseFinish => {
  const matches = buildingFinishes.filter(
    (finish) =>
      finish.modelBindings?.some(
        (binding) =>
          (/[:/\-]$/.test(binding.model)
            ? modelId.startsWith(binding.model)
            : modelId === binding.model) && binding.faces.includes(faceId),
      ) ?? false,
  );
  if (matches.length !== 1)
    throw new Error(
      `expected one finish for ${modelId}/${faceId}, found ${matches.length}`,
    );
  return matches[0]!;
};
