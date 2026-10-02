import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanPersonSeam } from "../structures/IAutoMovieHumanPersonSeam";
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
 *
 * @evidence contracts/common.md#principled-implementation The shared scalar clip emits corner stencils; applying them to every parallel attribute keeps the corner's chart and source correspondence while preserving its performed source edge.
 * @evidence contracts/common.md#clear-and-simple-design Topology belongs to clipHumanPersonTriangles; this consumer only gathers region attributes and resident numbering.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject, triangle or fitted threshold changes the shared cut; unsupported skinned or nonindexed input refuses.
 * @evidence contracts/common.md#meaningful-documentation States stage order, chart identity, posing semantics, ownership and refusals.
 * @evidence contracts/modeling.md#emitted-geometry The shared clipped polygon supplies all triangles; chart duplication follows attribute identity.
 * @evidence contracts/modeling.md#shared-boundaries Source identities are shared across regions while corner attributes retain their own charts.
 * @evidence contracts/modeling.md#spatial-conventions Positions retain the caller's metres and posed frame; UVs, colours, relief and fractions are dimensionless.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Gathers one existing region and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Defines no authored channel.
 * @evidenceExclude contracts/modeling.md#rendered-observation The assembled seam owns displayed observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Defines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admits no anatomical input.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Defines no user input.
 */
export function clipHumanPersonMesh(
  mesh: IAutoMovieMesh,
  sources: readonly number[],
  cut: NonNullable<IAutoMovieHumanPersonSeam["cut"]>,
): { mesh: IAutoMovieMesh; sources: number[] } {
  if (mesh.indices === null || mesh.skin !== null)
    throw new Error("Person clipping requires a static indexed mesh.");
  const corners = clipHumanPersonTriangles(mesh.indices.map((v) => sources[v]), cut);
  const output: IAutoMovieMesh = {
    positions: [], normals: mesh.normals === null ? null : [],
    uvs: mesh.uvs === null ? null : [], indices: [], skin: null,
    ...(mesh.colors === undefined ? {} : { colors: [] }),
    ...(mesh.reliefWeights === undefined ? {} : { reliefWeights: [] }),
  };
  const resident = new Map<string, number>();
  const outputSources: number[] = [];
  for (const corner of corners) {
    const a = mesh.indices[corner.a];
    const b = mesh.indices[corner.b];
    const gather = (values: number[], width: number): number[] =>
      Array.from({ length: width }, (_, axis) =>
        (1 - corner.t) * values[a * width + axis] + corner.t * values[b * width + axis],
      );
    const uv = mesh.uvs === null ? null : gather(mesh.uvs, 2);
    const color = mesh.colors === undefined ? undefined : gather(mesh.colors, 3);
    const relief = mesh.reliefWeights === undefined ? undefined : gather(mesh.reliefWeights, 1);
    const key = `${corner.vertex}/${uv?.join(",") ?? ""}/${color?.join(",") ?? ""}/${relief?.join(",") ?? ""}`;
    let index = resident.get(key);
    if (index === undefined) {
      index = resident.size;
      resident.set(key, index);
      outputSources.push(corner.vertex);
      output.positions.push(...gather(mesh.positions, 3));
      if (mesh.normals !== null) output.normals!.push(...gather(mesh.normals, 3));
      if (uv !== null) output.uvs!.push(...uv);
      if (color !== undefined) output.colors!.push(...color);
      if (relief !== undefined) output.reliefWeights!.push(...relief);
    }
    output.indices!.push(index);
  }
  return { mesh: output, sources: outputSources };
}
