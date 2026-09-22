import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBuild } from "../structures/IAutoMovieHumanBodyBuild";

/**
 * Split a built body into one mesh part per dominant bone, so the model
 * crossing instrument can name which two segments of one connected skin
 * cross: upper arm against chest, thigh against thigh, forearm against
 * upper arm.
 *
 * The partition is the skin binding itself: a vertex belongs to the bone
 * with its largest weight, and a triangle to the bone the majority of its
 * corners belong to (a three-way tie goes to the first corner's bone, which
 * is deterministic). Parts are emitted in the basis's joint order so a pair
 * reads the same way across states. Adjacent segments share their seam
 * vertices, and the crossing instrument excludes triangles that touch at a
 * corner, so a seam does not report as a crossing; a fold at a bent joint
 * pierces triangles and does. The region splitter emits one output vertex
 * per distinct (source vertex, corner UV) pair in first-occurrence order, so
 * a UV seam duplicates a vertex; the walk here follows the same order to
 * know each output's source, and `sources` maps every part vertex back to
 * the basis vertex it came from. The split keeps the built normals and
 * material, so the parts remain a valid resident model.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-joints Names the two skin segments of one connected body that a posed joint drives into each other, which the census and the editor's contact check report.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-joints Partitions the built surface by dominant skin weight in joint order, preserving the region splitter's vertex order and the built normals.
 */
export function segmentHumanBodyModel(
  basis: IAutoMovieHumanBodyBasis,
  built: IAutoMovieHumanBodyBuild,
): { model: IAutoMovieModel; sources: Map<string, number[]> } {
  const surface = basis.surfaces[0];
  const geometry = built.model.parts[0].geometry;
  if (geometry.type !== "mesh")
    throw new Error("A built body part must be a resident mesh.");
  const mesh = geometry.mesh;
  const region = surface.regions[0];
  const outputs = new Map<string, number>();
  const order: number[] = [];
  region.indices.forEach((source, corner) => {
    const uv = region.uvs?.slice(corner * 2, corner * 2 + 2);
    const key = `${source}/${uv?.join(",") ?? ""}`;
    if (!outputs.has(key)) {
      outputs.set(key, order.length);
      order.push(source);
    }
  });
  if (order.length * 3 !== mesh.positions.length)
    throw new Error(
      "The segment partition does not match the built vertex population.",
    );
  const dominant = order.map((source) => {
    let best = 0;
    for (let k = 1; k < 4; k++)
      if (
        surface.skin.weights[source * 4 + k] >
        surface.skin.weights[source * 4 + best]
      )
        best = k;
    return surface.skin.boneIndices[source * 4 + best];
  });
  const indices = mesh.indices!;
  const buckets = new Map<number, number[]>();
  for (let t = 0; t < indices.length; t += 3) {
    const bones = [indices[t], indices[t + 1], indices[t + 2]].map(
      (v) => dominant[v],
    );
    const owner =
      bones[1] === bones[2] && bones[0] !== bones[1] ? bones[1] : bones[0];
    const list = buckets.get(owner);
    if (list === undefined)
      buckets.set(owner, [indices[t], indices[t + 1], indices[t + 2]]);
    else list.push(indices[t], indices[t + 1], indices[t + 2]);
  }
  const sources = new Map<string, number[]>();
  const parts = [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bone, tris]) => {
      const part = submesh(mesh, tris);
      sources.set(
        surface.skin.joints[bone],
        part.outputs.map((output) => order[output]),
      );
      return {
        id: surface.skin.joints[bone],
        name: surface.skin.joints[bone],
        material: built.model.parts[0].material,
        geometry: { type: "mesh" as const, mesh: part.mesh },
        attachedBone: null,
        transform: null,
      };
    });
  return { model: { ...built.model, parts }, sources };
}

/**
 * Extract the triangles into their own compact mesh, keeping normals, and
 * report which built output vertex each compact vertex came from so a caller
 * can read weights or basis rows for it.
 */
function submesh(
  mesh: IAutoMovieMesh,
  tris: number[],
): { mesh: IAutoMovieMesh; outputs: number[] } {
  const map = new Map<number, number>();
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const outputs: number[] = [];
  for (const output of tris) {
    let index = map.get(output);
    if (index === undefined) {
      index = map.size;
      map.set(output, index);
      outputs.push(output);
      positions.push(...mesh.positions.slice(output * 3, output * 3 + 3));
      normals.push(...mesh.normals!.slice(output * 3, output * 3 + 3));
    }
    indices.push(index);
  }
  return {
    mesh: { positions, normals, indices, uvs: null, skin: null },
    outputs,
  };
}
