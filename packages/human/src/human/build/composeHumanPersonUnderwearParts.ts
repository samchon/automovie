import type { IAutoMovieModel } from "@automovie/interface";

import { applyHumanBodyUnderwearMaterial } from "../../body/basis/applyHumanBodyUnderwearMaterial";
import type { IHumanPersonUnderwearPartsInput } from "../structures/IHumanPersonUnderwearPartsInput";

/**
 * Apply the prepared fabric only to explicitly registered final Body regions.
 * Face, neck stitching and anatomical layer readings finish before this step.
 * The Body namespace is the Person material composition's existing convention;
 * region membership comes from the source owner rather than a name heuristic.
 */
export function composeHumanPersonUnderwearParts(
  input: IHumanPersonUnderwearPartsInput,
): IAutoMovieModel["parts"] {
  const garment = input.garment;
  if (garment === undefined) return input.parts;
  const material = { ...garment.material, id: "body:" + garment.material.id };
  return input.parts.flatMap((part) => {
    const region = input.regions.get(part.id);
    return region === undefined ? [part] : applyHumanBodyUnderwearMaterial({
      part, field: region.field, sources: region.sources, material,
    });
  });
}
