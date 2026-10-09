import type { IAutoMovieModel } from "@automovie/interface";

import { applyHumanBodyUnderwearMaterial } from "../../body/basis/applyHumanBodyUnderwearMaterial";
import type { IHumanPersonUnderwearPartsInput } from "../structures/IHumanPersonUnderwearPartsInput";

/**
 * Apply the prepared fabric only to explicitly registered final Body regions.
 * Face, neck stitching and anatomical layer readings finish before this step.
 * The Body namespace is the Person material composition's existing convention;
 * region membership comes from the source owner rather than a name heuristic.
 *
 * @evidence contracts/common.md#principled-implementation Only final regions explicitly registered by the Body source loop receive the prepared material partition.
 * @evidence contracts/common.md#clear-and-simple-design One final assembly operation consumes part membership, field correspondence and the fabric material.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No geometric correction, coordinate match or part-name guess establishes region membership.
 * @evidence contracts/common.md#meaningful-documentation States final stage ordering and source-owned namespace/membership.
 * @evidence contracts/modeling.md#part-identity-and-grouping Body material identity is rebound to the existing Person namespace while Face and anatomical parts retain their membership.
 * @evidenceExclude contracts/modeling.md#parameter-channels Prepared coverage and colour retain their admitted meanings.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The shared material partition owns triangle emission.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Source part frames remain unchanged.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The partition owner constructs the actual common edge samples.
 * @evidenceExclude contracts/modeling.md#rendered-observation Complete Person consumers observe this material assembly.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing model admission retains its conditions.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no shaping input.
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
