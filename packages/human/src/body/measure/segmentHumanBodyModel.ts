import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBuild } from "../structures/IAutoMovieHumanBodyBuild";
import { createHumanBodySegmenter } from "./createHumanBodySegmenter";

/**
 * Split one built body into dominant-bone contact segments on demand.
 *
 * `createHumanBodySegmenter` owns the skin-binding and UV-corner partition.
 * This direct entry compiles it for a single built model; a worker or pose
 * search that evaluates several documents against one immutable basis keeps
 * that compiled function and reuses the same topology. Either path copies
 * each build's own posed metre positions and normals into new mesh parts and
 * returns fresh source-vertex correspondence. Skin contact is still measured
 * separately and this partition does not model internal bone surfaces.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-joints Names the two skin segments of one connected body that a posed joint drives into each other, which the census and the editor's contact check report.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints Partitions the built surface by dominant skin weight in joint order, preserving the region splitter's vertex order and the built normals.
 */
export function segmentHumanBodyModel(
  basis: IAutoMovieHumanBodyBasis,
  built: IAutoMovieHumanBodyBuild,
): { model: IAutoMovieModel; sources: Map<string, number[]> } {
  return createHumanBodySegmenter(basis)(built);
}
