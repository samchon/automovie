import type { IAutoMovieModel, IAutoMovieMaterial } from "@automovie/interface";

import { applyHumanBodyUnderwearMaterial } from "../../body/basis/applyHumanBodyUnderwearMaterial";
import type { IHumanPersonUnderwearPartsInput } from "../structures/IHumanPersonUnderwearPartsInput";

/**
 * Cut and lift prepared fabric only from registered final Body regions. Face, neck stitching and anatomical layer readings finish before this step. The Body namespace is the Person material composition's existing convention; region membership comes from the source owner rather than a name heuristic.
 *
 * An omitted garment returns the same part array. Otherwise registered regions retain their original skin and append an independent normal-lifted covered fabric part in metres; this blocking representation provides no cloth fitting or self-contact guarantee. Caller parts and coverage remain unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Exact source-owned final region membership routes carried rest coverage to the established partition-and-normal-lift owner, retaining original skin as anatomy authority.
 * @evidence contracts/common.md#clear-and-simple-design This composition owns body material namespacing and part selection; coverage clipping, fabric geometry and normal rebuilding remain with the body garment owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No arbitrary part-name heuristic infers region membership; normal lift is an explicit blocking costume rather than fitted cloth or an anatomical surface replacement.
 * @evidence contracts/common.md#meaningful-documentation Prose states unchanged omission, metre offset, independent appended fabric, input ownership and absence of fitting/self-contact proof.
 * @evidence contracts/performance.md#efficient-algorithms One O(P) part/map pass dispatches only registered regions; their source-aware clipping and covered-mesh lift/normal costs remain charged to the garment owner.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing final skin, normals and carried coverage are consumed directly; original parts are retained and no garment result is cached across changed posed geometry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned array owns its composition and appended fabric meshes while borrowing original parts; call-local material copy and partition temporaries retain no global resource.
 */
export function composeHumanPersonUnderwearParts(
  input: IHumanPersonUnderwearPartsInput,
): IAutoMovieModel["parts"] {
  const garment: IHumanPersonUnderwearPartsInput["garment"] = input.garment;
  if (garment === undefined) return input.parts;
  const material: IAutoMovieMaterial = { ...garment.material, id: "body:" + garment.material.id };
  return input.parts.flatMap((part: IAutoMovieModel["parts"][number]): IAutoMovieModel["parts"] => {
    const region: ReturnType<IHumanPersonUnderwearPartsInput["regions"]["get"]> = input.regions.get(part.id);
    return region === undefined ? [part] : applyHumanBodyUnderwearMaterial({
      part, field: region.field, sources: region.sources, material,
      offsetMetres: garment.offsetMetres,
    });
  });
}
