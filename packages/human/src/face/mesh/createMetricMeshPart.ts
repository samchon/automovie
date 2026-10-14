import { transformAutoMovieMesh } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieModelPart } from "@automovie/interface";

import { millimetrePoint as p } from "./millimetrePoint";

/**
 * Publish a placed head-frame millimetre mesh in model metres through the
 * shared engine transform. The part has null TRS; later runtime/export
 * Float32 publication and actual visual verification remain separate gates.
 *
 * @evidence contracts/common.md#principled-implementation Uniform 0.001 scaling converts placed head-millimetre geometry through shared engine position/normal/physical admission, leaving no extra part placement. Later Float32 output can still refuse a mesh that passed this stage.
 * @evidence contracts/common.md#clear-and-simple-design This part constructor owns unit conversion/metadata; components own geometry and final model/export owners own publication admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The SI factor is the coordinate contract, not appearance correction. Null TRS avoids repeated scaling and conversion establishes no final Float32/GPU/likeness certificate.
 * @evidence contracts/common.md#meaningful-documentation Prose states placed input units, metre output, null TRS, shared transform and separate precision/visual boundaries.
 * @evidence contracts/performance.md#efficient-algorithms Engine transformation scans/copies actual positions/normals/other attributes/physical records in linear population work; part metadata is fixed-size.
 * @evidence contracts/performance.md#reuse-equivalent-work Numerical components share this unit owner; distinct mutable source meshes require distinct output buffers and no transformed result cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Fresh arrays/part transfer, sources remain borrowed, and no task/handle or retained transform cache is acquired.
 */
export const createMetricMeshPart: (id: string, mesh: IAutoMovieMesh, finish: string) => IAutoMovieModelPart & { geometry: { type: "mesh"; mesh: IAutoMovieMesh; }; } = (
  id: string,
  mesh: IAutoMovieMesh,
  finish: string,
): IAutoMovieModelPart & {
  geometry: { type: "mesh"; mesh: IAutoMovieMesh };
} => ({
  id,
  name: id,
  material: finish,
  attachedBone: null,
  transform: null,
  geometry: {
    type: "mesh",
    mesh: transformAutoMovieMesh(mesh, { scale: p(0.001, 0.001, 0.001) }),
  },
});
