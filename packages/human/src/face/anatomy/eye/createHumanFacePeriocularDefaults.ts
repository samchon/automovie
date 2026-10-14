import type { IHumanFacePoseGeometry } from "../../basis/IHumanFacePoseGeometry";
import type { AutoMovieHumanFacePeriocularTissue } from "../../structures/AutoMovieHumanFacePeriocularTissue";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFacePeriocularTissueDescriptor } from "../../structures/IAutoMovieHumanFacePeriocularTissueDescriptor";
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
 * @evidence contracts/common.md#principled-implementation Whole-section omission expands descriptor-owned defaults only for sides with registered cages and generated optics.
 * @evidence contracts/common.md#clear-and-simple-design Explicit selection returns unchanged while absent sections receive fresh tissue records, leaving descriptor classification and physical admission downstream.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Defaults do not invent unavailable source cages or override explicitly empty tissue sections.
 * @evidence contracts/common.md#meaningful-documentation The prose states omission versus empty selection, owned expansion and measured-site/authored descriptor qualification.
 * @evidence contracts/performance.md#efficient-algorithms Two side checks and the fixed tissue descriptor population require bounded work without geometry traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work All default values come from one shared descriptor owner; each expanded document receives fresh records.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned explicit record remains borrowed or newly expanded records become caller-owned; no cache, geometry or external resource is retained.
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
      HUMAN_FACE_PERIOCULAR_TISSUE_DESCRIPTORS.map(
        (
          descriptor: IAutoMovieHumanFacePeriocularTissueDescriptor,
        ): [
          AutoMovieHumanFacePeriocularTissue,
          { inwardOffsetMm: number; thicknessMm: number },
        ] => [
          descriptor.tissue,
          {
            inwardOffsetMm: descriptor.inwardOffset.defaultMm,
            thicknessMm: descriptor.thickness.defaultMm,
          },
        ],
      ),
    );
  }
  return Object.keys(result).length === 0 ? undefined : result;
}
