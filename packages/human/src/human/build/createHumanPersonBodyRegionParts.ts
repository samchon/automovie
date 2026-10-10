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
