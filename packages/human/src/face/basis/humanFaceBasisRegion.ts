import type { IAutoMovieMesh } from "@automovie/interface";

import { createHumanBasisRegion } from "../../common/basis/createHumanBasisRegion";
import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";

/**
 * Emit a material region from an already evaluated connected surface.
 * The basis builder computes the common normals first. UV seams may duplicate a
 * vertex here, but never change that vertex's position, deformation or normal.
 * Inputs are admitted by the basis compiler; this function owns no mutable cache.
 * Metres and normalized/source UV values pass through without coordinate changes.
 *
 * @evidence contracts/common.md#principled-implementation The admitted region's canonical render corner gather copies matching evaluated positions and common normals through createHumanBasisRegion; seam aliases preserve shared source values while selecting the authored UV incidence.
 * @evidence contracts/common.md#clear-and-simple-design This compatibility operation delegates indexing and validation to the common face/body region owner instead of maintaining another face-specific gather implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No welding, source-number substitution, coordinate conversion or independently recomputed seam normal is applied here. Resident source/normal correspondence is a caller premise, not proof of cross-part fit or physical registration.
 * @evidence contracts/common.md#meaningful-documentation Prose gives caller admission, common-normal timing, seam duplication, metre/UV pass-through and absence of mutable cache ownership.
 * @evidence contracts/performance.md#efficient-algorithms Every call compiles region corner incidence and copies the emitted corner/triangle arrays, proportional to that region's indices and emitted vertices. The resident builder uses separately compiled gathers for repeated edits instead of this one-shot compatibility path.
 * @evidence contracts/performance.md#reuse-equivalent-work Common gather logic is shared across face/body; this one-shot wrapper creates no retained evaluator and reuses only the caller's completed positions/normals. Repeated current production gathers are owned by createHumanFaceResidentParts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh mesh arrays transfer to the caller and temporary gather tables become collectible; no basis, prior mesh, task or external handle is retained by this wrapper.
 */
export function humanFaceBasisRegion(
  positions: number[],
  normals: number[],
  region: IAutoMovieHumanFaceBasis["surfaces"][number]["regions"][number],
): IAutoMovieMesh {
  return createHumanBasisRegion(region)(positions, normals);
}
