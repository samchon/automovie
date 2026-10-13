import type { IAutoMovieModel, IAutoMovieMesh } from "@automovie/interface";

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
 * Place legacy Body skin regions and carry rest coverage through their same cut, stitch and compaction. Coverage follows each actual source stencil; evaluating it again on posed neck coordinates would reattach the garment. Unregistered derived points retain the legacy position-derived topology. Registered strict seam insertions remain subject to the original refusal.
 *
 * Geometry uses the final joined metre frame; coverage is a dimensionless rest field, carried through identical interpolation and survivor ordering rather than sampled again on posed geometry. Generated scalar lineage is internal material correspondence, not newly certified canonical physical skin IDs.
 *
 * @evidence contracts/common.md#principled-implementation The frozen cut evaluates rest coverage once, then each source region carries it through clipping, actual stitch parent weights and exact survivor compaction alongside final placed geometry.
 * @evidence contracts/common.md#clear-and-simple-design Existing cut/place/stitch/compact owners remain authoritative; this composition owns body namespacing and aligned garment-field receipts rather than duplicating seam geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Registered unowned cut/centroid points still refuse, and internal scalar lineage does not replace physical registration or reevaluate garment coverage from posed coordinates.
 * @evidence contracts/common.md#meaningful-documentation Prose gives metre geometry versus dimensionless coverage, fixed rest meaning, exact interpolation/survivor order and lineage limits.
 * @evidence contracts/performance.md#efficient-algorithms Coverage cut is one source/intersection pass; each region incurs its actual clip and stitch cost, including boundary-parameter searches/sorts, followed by linear survivor compaction and scalar gathering.
 * @evidence contracts/performance.md#reuse-equivalent-work One evaluated coverage population serves all body regions, and actual geometry append/survivor receipts drive scalar transport without recomputing independent posed-space correspondence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned parts and garment maps own emitted/compacted records; clipped meshes, mutable scalar/lineage arrays and stitch receipts are call-local, with no retained task or global cache.
 */
export function createHumanPersonBodyRegionParts(
  input: IHumanPersonBodyRegionPartsInput,
): IHumanPersonBodyRegionParts {
  const parts: IAutoMovieModel["parts"] = [];
  const garmentFields: Map<string, Pick<IHumanBodyUnderwearRegion, "field" | "sources">> = new Map<string, Pick<IHumanBodyUnderwearRegion, "field" | "sources">>();
  const coverage: number[] | undefined = input.garment === undefined ? undefined : evaluateHumanPersonCut(
    input.garment.sourceFields[input.surface].flatMap((value: number): number[] => [value, value, value]), input.cut,
  ).filter((_: number, at: number): boolean => at % 3 === 0);
  for (const part of input.parts) {
    const mesh: IAutoMovieMesh = meshOfHumanPart(part);
    const sources: readonly number[] | undefined = input.regions.get(part.id);
    const garmentRegion: IHumanBodyUnderwearRegion | undefined = input.garment?.regions.get(part.id);
    const id: string = "body:" + part.id;
    if (sources === undefined) {
      parts.push(prefixHumanPersonPart("body", part, mesh));
      if (garmentRegion !== undefined) garmentFields.set(id, garmentRegion);
      continue;
    }
    const clipped: ReturnType<typeof clipHumanPersonMesh> = clipHumanPersonMesh(mesh, sources, input.cut);
    const scalar: number[] | undefined = garmentRegion === undefined ? undefined
      : clipped.sources.map((source: number): number => coverage![source]);
    const lineage: number[] = clipped.sources.slice();
    let fieldSources: readonly number[] = lineage;
    let field: readonly number[] | undefined = scalar;
    const stitched: IAutoMovieMesh = stitchHumanPersonBoundary({
      ...input.stitch, mesh: input.place(clipped.mesh, clipped.sources),
      sources: clipped.sources, side: "body",
      appendSourceScalar: scalar === undefined ? undefined : (vertex: number, parents: readonly number[], weights: readonly number[]): void => {
        scalar[vertex] = parents.reduce((sum: number, parent: number, at: number): number => sum + scalar[parent] * weights[at], 0);
        lineage[vertex] = input.cut.margins.length + input.cut.intersections.length + vertex;
      },
    });
    const compacted: IAutoMovieMesh = dropHumanMeshTriangles(stitched, (): boolean => false, scalar === undefined ? undefined
      : (survivors: readonly number[]): void => {
          fieldSources = survivors.map((vertex: number): number => lineage[vertex]);
          field = survivors.map((vertex: number): number => scalar[vertex]);
        });
    parts.push(prefixHumanPersonPart("body", part, compacted));
    if (field !== undefined) garmentFields.set(id, { sources: fieldSources, field });
  }
  return { parts, garmentFields };
}
