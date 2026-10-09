import type { IAutoMovieModel } from "@automovie/interface";

import type { IHumanBodyUnderwearRegion } from "../../body/structures/IHumanBodyUnderwearRegion";
import { clipHumanPersonMesh } from "../seam/clipHumanPersonMesh";
import { dropHumanMeshTriangles } from "../seam/dropHumanMeshTriangles";
import { evaluateHumanPersonCut } from "../seam/evaluateHumanPersonCut";
import type { IHumanPersonBodyRegionParts } from "../structures/IHumanPersonBodyRegionParts";
import type { IHumanPersonBodyRegionPartsInput } from "../structures/IHumanPersonBodyRegionPartsInput";
import { meshOfHumanPart } from "./meshOfHumanPart";
import { prefixHumanPersonPart } from "./prefixHumanPersonPart";
import { stitchHumanPersonBoundary } from "./stitchHumanPersonBoundary";

/**
 * Place legacy Body skin regions and carry rest coverage through their same
 * cut, stitch and compaction. Coverage follows each actual source stencil;
 * evaluating it again on posed neck coordinates would reattach the garment.
 * Unregistered derived points retain the legacy position-derived topology.
 * Registered strict seam insertions remain subject to the original refusal.
 *
 * @evidence contracts/common.md#principled-implementation Actual cut fractions, stitch parent weights and survivor ordinals carry the same rest scalar through every changed vertex population.
 * @evidence contracts/common.md#clear-and-simple-design One legacy region-composition owner sequences the existing cut, placement, stitch and compaction operations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No neck exemption or posed coordinate fit replaces material correspondence; registered seam refusals remain intact.
 * @evidence contracts/common.md#meaningful-documentation Defines stencil transport, legacy metadata absence and preserved registered refusal.
 * @evidence contracts/modeling.md#emitted-geometry Existing cut and stitch owners retain their actual geometry emission; this composition only carries its scalar correspondence alongside.
 * @evidence contracts/modeling.md#spatial-conventions Original performed metre coordinates remain in the existing Person frame; coverage is transported by dimensionless stencil weights.
 * @evidence contracts/modeling.md#shared-boundaries Source scalar and every mesh attribute consume the same actual inserted-point and survivor operations.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Original parts retain the Person's established namespace; final garment composition owns fabric parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels No new personal or garment control is defined.
 * @evidenceExclude contracts/modeling.md#rendered-observation Final Person consumers observe the result of this transport.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Transports source incidence without adding anatomy.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing cut, source and final model admission decide supported geometry.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no shaping input.
 */
export function createHumanPersonBodyRegionParts(
  input: IHumanPersonBodyRegionPartsInput,
): IHumanPersonBodyRegionParts {
  const parts: IAutoMovieModel["parts"] = [];
  const garmentFields = new Map<string, Pick<IHumanBodyUnderwearRegion, "field" | "sources">>();
  const coverage = input.garment === undefined ? undefined : evaluateHumanPersonCut(
    input.garment.sourceFields[input.surface].flatMap((value) => [value, value, value]), input.cut,
  ).filter((_, at) => at % 3 === 0);
  for (const part of input.parts) {
    const mesh = meshOfHumanPart(part);
    const sources = input.regions.get(part.id);
    const garmentRegion = input.garment?.regions.get(part.id);
    const id = "body:" + part.id;
    if (sources === undefined) {
      parts.push(prefixHumanPersonPart("body", part, mesh));
      if (garmentRegion !== undefined) garmentFields.set(id, garmentRegion);
      continue;
    }
    const clipped = clipHumanPersonMesh(mesh, sources, input.cut);
    const scalar = garmentRegion === undefined ? undefined
      : clipped.sources.map((source) => coverage![source]);
    const lineage = clipped.sources.slice();
    let fieldSources: readonly number[] = lineage;
    let field: readonly number[] | undefined = scalar;
    const stitched = stitchHumanPersonBoundary({
      ...input.stitch, mesh: input.place(clipped.mesh, clipped.sources),
      sources: clipped.sources, side: "body",
      appendSourceScalar: scalar === undefined ? undefined : (vertex, parents, weights) => {
        scalar[vertex] = parents.reduce((sum, parent, at) => sum + scalar[parent] * weights[at], 0);
        lineage[vertex] = input.cut.margins.length + input.cut.intersections.length + vertex;
      },
    });
    const compacted = dropHumanMeshTriangles(stitched, () => false, scalar === undefined ? undefined
      : (survivors) => {
          fieldSources = survivors.map((vertex) => lineage[vertex]);
          field = survivors.map((vertex) => scalar[vertex]);
        });
    parts.push(prefixHumanPersonPart("body", part, compacted));
    if (field !== undefined) garmentFields.set(id, { sources: fieldSources, field });
  }
  return { parts, garmentFields };
}
