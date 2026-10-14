import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshPhysicalSource,
} from "@automovie/interface";

import type { IAutoMovieHumanPersonSeam } from "../structures/IAutoMovieHumanPersonSeam";
import type { IHumanPersonClippedMesh } from "../structures/IHumanPersonClippedMesh";
import { clipHumanPersonTriangles } from "./clipHumanPersonTriangles";

/**
 * Gather one already-posed static indexed body region through its captured source cut. Position/normal/UV/colour/relief interpolate original endpoint values; normals are not normalized here. Resident keys include source vertex and attribute chart, preserving atlas seams while the downstream collar owner scatters its positions/normals. Source cut arrays must remain unchanged throughout this correspondence.
 *
 * Registered physical metadata is copied through exact cut endpoints. A strict new cut point has no registered lineage in this consumer and refuses rather than inventing an ID; absent metadata keeps legacy clipping. The topology cutter owns local endpoint degeneracy/winding decisions, with no global collision or manifold certification added here.
 *
 * @evidence contracts/common.md#principled-implementation Actual source-indexed cut corners drive affine posed attribute gather and registered endpoint correspondence.
 * @evidence contracts/common.md#clear-and-simple-design The shared triangle cutter owns topology; this adapter owns chart-sensitive resident indexing and independent output buffers before collar scatter.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Static indexed input is enforced, atlas seams remain distinct and strict registered cuts refuse rather than minting source lineage or reskinning posed coordinates.
 * @evidence contracts/common.md#meaningful-documentation Prose states cut lifetime, posed affine fields, unnormalized normals, physical endpoint limits and downstream/global boundaries.
 * @evidence contracts/performance.md#efficient-algorithms Source-index mapping and cut traversal follow actual triangles; a resident map shares equal source/attribute corners with fixed-width field gather instead of pairwise weld searches.
 * @evidence contracts/performance.md#reuse-equivalent-work One cutter result serves every attribute and physical endpoint gather, while resident keys share already-emitted corners within this call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All output arrays/source records are owned and population-bounded; corner/resident workspace is call-local and no asset task, rig or render resource is retained.
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
  const corners: ReturnType<typeof clipHumanPersonTriangles> =
    clipHumanPersonTriangles(
      mesh.indices.map((v: number): number => sources[v]),
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
            sources: mesh.physicalVertices.sources.map(
              (
                source: IAutoMovieMeshPhysicalSource,
              ): IAutoMovieMeshPhysicalSource => ({
                ...source,
              }),
            ),
            vertices: [],
          },
        }),
  };
  const resident: Map<string, number> = new Map<string, number>();
  const outputSources: number[] = [];
  for (const corner of corners) {
    const a: number = mesh.indices[corner.a];
    const b: number = mesh.indices[corner.b];
    const gather: (values: number[], width: number) => number[] = (
      values: number[],
      width: number,
    ): number[] =>
      Array.from(
        { length: width },
        (_: unknown, axis: number): number =>
          (1 - corner.t) * values[a * width + axis] +
          corner.t * values[b * width + axis],
      );
    const uv: number[] | null = mesh.uvs === null ? null : gather(mesh.uvs, 2);
    const color: number[] | undefined =
      mesh.colors === undefined ? undefined : gather(mesh.colors, 3);
    const relief: number[] | undefined =
      mesh.reliefWeights === undefined
        ? undefined
        : gather(mesh.reliefWeights, 1);
    const key: string = `${corner.vertex}/${uv?.join(",") ?? ""}/${color?.join(",") ?? ""}/${relief?.join(",") ?? ""}`;
    let index: number | undefined = resident.get(key);
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
