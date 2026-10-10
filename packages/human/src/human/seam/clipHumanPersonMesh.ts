import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanPersonSeam } from "../structures/IAutoMovieHumanPersonSeam";
import type { IHumanPersonClippedMesh } from "../structures/IHumanPersonClippedMesh";
import { clipHumanPersonTriangles } from "./clipHumanPersonTriangles";

/**
 * Gather one posed body region through the seam's frozen source cut.
 * The builder calls this before scattering conformed positions and joined
 * normals. Corner UVs, colours and relief remain affine in their original
 * region endpoints. Resident identity includes the source and attribute chart,
 * so source welding never erases atlas seams. Every output array is owned.
 * Already posed endpoint positions are interpolated without reskinning; static
 * indexed input is required. The shared topology owner decides exact endpoint
 * degeneracies and winding. Changing the cut invalidates this correspondence.
 * Registered physical endpoints follow the same corner gather into owned
 * metadata. A strict new cut has no registered point in this consumer and
 * refuses when correspondence is present; omission retains legacy clipping.
 */
export function clipHumanPersonMesh(
  mesh: IAutoMovieMesh,
  sources: readonly number[],
  cut: NonNullable<IAutoMovieHumanPersonSeam["cut"]>,
): IHumanPersonClippedMesh {
  if (mesh.indices === null || mesh.skin !== null)
    throw new Error("Person clipping requires a static indexed mesh.");
  if (mesh.physicalVertices !== undefined)
    resolveAutoMovieMeshPhysicalVertices(mesh);
  const corners = clipHumanPersonTriangles(
    mesh.indices.map((v) => sources[v]),
    cut,
  );
  const output: IAutoMovieMesh = {
    positions: [],
    normals: mesh.normals === null ? null : [],
    uvs: mesh.uvs === null ? null : [],
    indices: [],
    skin: null,
    ...(mesh.colors === undefined ? {} : { colors: [] }),
    ...(mesh.reliefWeights === undefined ? {} : { reliefWeights: [] }),
    ...(mesh.physicalVertices === undefined
      ? {}
      : {
          physicalVertices: {
            sources: mesh.physicalVertices.sources.map((source) => ({
              ...source,
            })),
            vertices: [],
          },
        }),
  };
  const resident = new Map<string, number>();
  const outputSources: number[] = [];
  for (const corner of corners) {
    const a = mesh.indices[corner.a];
    const b = mesh.indices[corner.b];
    const gather = (values: number[], width: number): number[] =>
      Array.from(
        { length: width },
        (_, axis) =>
          (1 - corner.t) * values[a * width + axis] +
          corner.t * values[b * width + axis],
      );
    const uv = mesh.uvs === null ? null : gather(mesh.uvs, 2);
    const color =
      mesh.colors === undefined ? undefined : gather(mesh.colors, 3);
    const relief =
      mesh.reliefWeights === undefined
        ? undefined
        : gather(mesh.reliefWeights, 1);
    const key = `${corner.vertex}/${uv?.join(",") ?? ""}/${color?.join(",") ?? ""}/${relief?.join(",") ?? ""}`;
    let index = resident.get(key);
    if (index === undefined) {
      index = resident.size;
      resident.set(key, index);
      outputSources.push(corner.vertex);
      if (output.physicalVertices !== undefined) {
        if (corner.t !== 0 && corner.t !== 1)
          throw new Error(
            "Person physical registration does not support an unregistered strict cut point.",
          );
        output.physicalVertices.vertices.push(
          mesh.physicalVertices!.vertices[corner.t === 0 ? a : b],
        );
      }
      output.positions.push(...gather(mesh.positions, 3));
      if (mesh.normals !== null)
        output.normals!.push(...gather(mesh.normals, 3));
      if (uv !== null) output.uvs!.push(...uv);
      if (color !== undefined) output.colors!.push(...color);
      if (relief !== undefined) output.reliefWeights!.push(...relief);
    }
    output.indices!.push(index);
  }
  return { mesh: output, sources: outputSources };
}
