import {
  inspectAutoMovieMeshTopology,
  measureAutoMovieMeshCrossings,
} from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanConstructionPartReading } from "../../common/structures/IAutoMovieHumanConstructionPartReading";

/**
 * Take the census of every mesh part of a constructed face model.
 *
 * Coordinates are rounded to Float32 first, the precision the model emits.
 * Counts come from the engine topology instrument, which welds coincident
 * coordinates, so a seam of duplicated shading vertices is not a boundary.
 * A region of a larger surface legitimately has boundary edges where it meets
 * its neighbouring regions; the census reports the count and judges nothing.
 * Self-crossings are the engine crossing census with the part as both
 * arguments, which ignores triangles that merely share an edge or a corner.
 *
 * @evidence contracts/common.md#principled-implementation The engine topology instrument reads the emitted buffers of each part; bounds are the coordinate extrema of the same buffers.
 * @evidence contracts/common.md#clear-and-simple-design One pass over the model parts with one record each.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every mesh part is read; none is filtered by identity.
 * @evidence contracts/common.md#meaningful-documentation States precision, welding and why a boundary count is not a verdict.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the head frame on Float32 coordinates.
 * @evidence contracts/modeling.md#emitted-geometry Reports the emitted counts of each part as constructed.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Reads existing part identities.
 * @evidenceExclude contracts/modeling.md#parameter-channels Consumes no channel.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Counts boundary edges; the part owners construct boundaries.
 * @evidenceExclude contracts/modeling.md#rendered-observation Numerical census.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Supplies no biological value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Bounds nothing.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no authoring input.
 */
export function readHumanFacePartCensus(
  model: IAutoMovieModel,
): IAutoMovieHumanConstructionPartReading[] {
  const readings: IAutoMovieHumanConstructionPartReading[] = [];
  for (const part of model.parts) {
    if (part.geometry.type !== "mesh") continue;
    const positions = part.geometry.mesh.positions.map(Math.fround);
    const minimum = [Infinity, Infinity, Infinity];
    const maximum = [-Infinity, -Infinity, -Infinity];
    for (let at = 0; at < positions.length; at += 3)
      for (let axis = 0; axis < 3; axis++) {
        minimum[axis] = Math.min(minimum[axis], positions[at + axis]);
        maximum[axis] = Math.max(maximum[axis], positions[at + axis]);
      }
    const mesh = { ...part.geometry.mesh, positions };
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
