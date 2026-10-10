import {
  inspectAutoMovieMeshTopology,
  measureAutoMovieMeshCrossings,
} from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";

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
 */
export function readHumanFacePartCensus(
  model: IAutoMovieModel,
): IAutoMovieHumanConstructionPartReading[] {
  const readings: IAutoMovieHumanConstructionPartReading[] = [];
  for (const part of model.parts) {
    if (part.geometry.type !== "mesh") continue;
    const mesh = readHumanLocalMeshWorld(part.geometry.mesh, part.transform);
    const positions = mesh.positions;
    const minimum = [Infinity, Infinity, Infinity];
    const maximum = [-Infinity, -Infinity, -Infinity];
    for (let at = 0; at < positions.length; at += 3)
      for (let axis = 0; axis < 3; axis++) {
        minimum[axis] = Math.min(minimum[axis], positions[at + axis]);
        maximum[axis] = Math.max(maximum[axis], positions[at + axis]);
      }
    const topology = inspectAutoMovieMeshTopology(mesh);
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
        (hit) => !hit.coplanar,
      ).length,
    });
  }
  return readings;
}
