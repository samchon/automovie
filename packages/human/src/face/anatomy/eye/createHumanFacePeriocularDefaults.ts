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
