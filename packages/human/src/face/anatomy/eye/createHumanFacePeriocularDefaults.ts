import type { IHumanFacePoseGeometry } from "../../basis/IHumanFacePoseGeometry";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFacePeriocularTissues } from "../../structures/IAutoMovieHumanFacePeriocularTissues";
import { HUMAN_FACE_PERIOCULAR_TISSUE_DESCRIPTORS } from "./HUMAN_FACE_PERIOCULAR_TISSUE_DESCRIPTORS";

/**
 * Expand omission of the whole tissue section into the owner-defined stack.
 *
 * Defaults are supplied only for a registered cage with generated optics.
 * An explicit tissue section, including an empty side, retains its selection
 * verbatim. Each expansion owns its records and changes no caller value.
 * The descriptors qualify these dimensions as measured-site values or
 * authored extensions; emission still undergoes ordinary space admission.
 *
 * @evidence contracts/common.md#principled-implementation Expands only section omission; explicit selection remains the existing sparse tissue contract.
 * @evidence contracts/common.md#clear-and-simple-design One conversion consumes the descriptor owner instead of copying its dimensions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source, optical dimension or supplied tissue record is modified to make space admission pass.
 * @evidence contracts/common.md#meaningful-documentation States omission, sparse selection, ownership and the unchanged downstream admission.
 * @evidence contracts/modeling.md#parameter-channels Preserves independently supplied tissue dimensions; omission reads the canonical defaults.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries the existing tissue identities.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no mesh.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The tissue builder owns the join.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Forwards descriptor millimetres without conversion.
 * @evidenceExclude contracts/modeling.md#rendered-observation The tissue builder owns displayed results.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The descriptor owns the defaults and their source qualifications.
 * @evidenceExclude contracts/anatomy.md#permitted-range Space admission remains with the tissue assembly.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Introduces no authoring channel.
 */
export function createHumanFacePeriocularDefaults(
  basis: IAutoMovieHumanFaceBasis,
  geometry: IHumanFacePoseGeometry | undefined,
): IAutoMovieHumanFacePeriocularTissues | undefined {
  if (geometry?.periocularTissues !== undefined)
    return geometry.periocularTissues;
  if (geometry?.eyes === undefined) return undefined;
  const result: IAutoMovieHumanFacePeriocularTissues = {};
  for (const side of ["left", "right"] as const) {
    if (basis.periocular?.[side].cage === undefined) continue;
    result[side] = Object.fromEntries(
      HUMAN_FACE_PERIOCULAR_TISSUE_DESCRIPTORS.map((descriptor) => [
        descriptor.tissue,
        {
          inwardOffsetMm: descriptor.inwardOffset.defaultMm,
          thicknessMm: descriptor.thickness.defaultMm,
        },
      ]),
    );
  }
  return Object.keys(result).length === 0 ? undefined : result;
}
