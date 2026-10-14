import {
  type IAutoMovieMeshCrossing as IAutoMovieMeshCrossingImported,
  type IAutoMovieMeshTopology as IAutoMovieMeshTopologyImported,
  inspectAutoMovieMeshTopology,
  measureAutoMovieMeshCrossings,
} from "@automovie/engine";
import type {
  IAutoMovieMesh as IAutoMovieMeshImported,
  IAutoMovieModel,
} from "@automovie/interface";

import { readHumanLocalMeshWorld } from "../../common/mesh/readHumanLocalMeshWorld";
import type { IAutoMovieHumanConstructionPartReading } from "../../common/structures/IAutoMovieHumanConstructionPartReading";

/**
 * Take the census of every mesh part of a constructed face model.
 *
 * Local coordinates are rounded to Float32, then the actual part TRS restores
 * the owning model frame without a second Float32 rounding.
 * Counts come from the engine topology instrument, which welds coincident
 * coordinates only for legacy meshes. Explicit physical metadata retains its
 * source incidence, so attribute aliases share source edges while distinct
 * source points remain distinct even at equal coordinates.
 * Coordinate-collapsed triangles still enter the independent degeneracy check.
 * A region of a larger surface legitimately has boundary edges where it meets
 * its neighbouring regions; the census reports the count and judges nothing.
 * Self-crossings are the engine crossing census with the part as both
 * arguments, which ignores triangles that merely share an edge or a corner.
 * Default crossings retain at most one witness per subject triangle; after
 * coplanar filtering the count is not every intersecting triangle pair.
 *
 * @evidence contracts/common.md#principled-implementation Local Float32 publication followed by actual TRS supplies one model-metre mesh view to bounds, native topology and self-crossing owners. Physical source incidence is preserved; volume and non-manifold/degenerate counts remain observations rather than acceptance or visual quality.
 * @evidence contracts/common.md#clear-and-simple-design Each mesh part owns one census record; topology and triangle intersection algorithms stay in the deterministic engine, while this reporter coordinates their shared actual geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Non-mesh parts are outside this mesh census, coincident physical sources are not coordinate-welded, and legitimate region boundaries are not repaired. Filtered default witnesses are explicitly not all intersecting pairs.
 * @evidence contracts/common.md#meaningful-documentation Prose states Float32/TRS precision, physical versus legacy topology, legitimate boundaries and default self-crossing population; bounds/volume use metres and cubic metres.
 * @evidence contracts/performance.md#efficient-algorithms Per-part publication/bounds are linear in mesh attributes; topology indexing and spatial candidate intersection work dominate larger meshes. Self-pair candidates can be quadratic, while retained witnesses are bounded by subject triangles.
 * @evidence contracts/performance.md#reuse-equivalent-work One world view serves all three instruments for a part; topology/crossing owners retain their own indexing. This request does not cache mutable model readings across constructions.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary transformed meshes and instrumentation indexes are local per part; one scalar census record per mesh transfers to the caller, with no retained geometry history or external handle.
 */
export function readHumanFacePartCensus(
  model: IAutoMovieModel,
): IAutoMovieHumanConstructionPartReading[] {
  const readings: IAutoMovieHumanConstructionPartReading[] = [];
  for (const part of model.parts) {
    if (part.geometry.type !== "mesh") continue;
    const mesh: IAutoMovieMeshImported = readHumanLocalMeshWorld(
      part.geometry.mesh,
      part.transform,
    );
    const positions: number[] = mesh.positions;
    const minimum: number[] = [Infinity, Infinity, Infinity];
    const maximum: number[] = [-Infinity, -Infinity, -Infinity];
    for (let at: number = 0; at < positions.length; at += 3)
      for (let axis: number = 0; axis < 3; axis++) {
        minimum[axis] = Math.min(minimum[axis], positions[at + axis]);
        maximum[axis] = Math.max(maximum[axis], positions[at + axis]);
      }
    const topology: IAutoMovieMeshTopologyImported =
      inspectAutoMovieMeshTopology(mesh);
    readings.push({
      subject: part.id,
      material: part.material,
      vertices: positions.length / 3,
      triangles: topology.triangles,
      minimum,
      maximum,
      boundaryEdges: topology.boundaryEdges,
      nonManifoldEdges: topology.nonManifoldEdges,
      degenerateTriangles: topology.degenerate,
      signedVolumeCubicMetres: topology.volume,
      selfCrossings: measureAutoMovieMeshCrossings(mesh, mesh).filter(
        (hit: IAutoMovieMeshCrossingImported): boolean => !hit.coplanar,
      ).length,
    });
  }
  return readings;
}
