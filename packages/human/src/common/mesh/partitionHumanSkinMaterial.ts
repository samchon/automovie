import type { IAutoMovieMesh, IAutoMovieMeshPhysicalSource } from "@automovie/interface";
import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";

import type { IHumanSkinMaterialPartition } from "../structures/IHumanSkinMaterialPartition";
import type { IHumanSkinMaterialPartitionInput } from "../structures/IHumanSkinMaterialPartitionInput";

/**
 * Partition an actual performed skin into complementary surface materials.
 * Rest-material coverage is piecewise linear on the original triangles. Each
 * strict crossing is evaluated from the same canonically ordered source edge
 * for both sides. Exact-zero endpoints retain their original source identity.
 * UV, colour, relief and shading aliases interpolate independently; physical
 * edge identity follows source parents and the exact represented fraction.
 * No position is lifted and no coincident underlying triangle is retained.
 * This is a zero-thickness surface garment, not cloth volume or crease fitting.
 * Original winding and downstream finite, Float32-area and topology admission
 * remain applicable, including refusal of an unrepresentable clipped sliver.
 */
export function partitionHumanSkinMaterial(
  input: IHumanSkinMaterialPartitionInput,
): IHumanSkinMaterialPartition {
  const { mesh, field, sources } = input;
  if (mesh.skin !== null || mesh.indices === null ||
      field.length !== mesh.positions.length / 3 || sources.length !== field.length ||
      !field.every(Number.isFinite))
    throw new Error("Skin material partition needs a static indexed mesh and matching finite source coverage.");
  if (mesh.physicalVertices !== undefined) resolveAutoMovieMeshPhysicalVertices(mesh);
  const physical = (vertex: number): IAutoMovieMeshPhysicalSource | undefined => {
    const reference = mesh.physicalVertices?.vertices[vertex];
    return reference === undefined || reference === null
      ? undefined : mesh.physicalVertices!.sources[reference];
  };
  const identity = (vertex: number): string => {
    const source = physical(vertex);
    return source === undefined ? "native:" + sources[vertex]
      : JSON.stringify([source.domain, source.id]);
  };
  const make = (covered: boolean): IAutoMovieMesh => {
    const output: IAutoMovieMesh = {
      positions: [], normals: mesh.normals === null ? null : [],
      uvs: mesh.uvs === null ? null : [], indices: [], skin: null,
      ...(mesh.colors === undefined ? {} : { colors: [] }),
      ...(mesh.reliefWeights === undefined ? {} : { reliefWeights: [] }),
      ...(mesh.physicalVertices === undefined ? {} : {
        physicalVertices: { sources: [], vertices: [] },
      }),
    };
    const resident = new Map<string, number>();
    const emit = (first: number, second: number): number => {
      let a = first, b = second;
      if (field[a] === 0) b = a;
      else if (field[b] === 0) a = b;
      if (a !== b && identity(a) > identity(b)) [a, b] = [b, a];
      const t = a === b ? 0 : field[a] / (field[a] - field[b]);
      const key = a + "/" + b;
      const previous = resident.get(key);
      if (previous !== undefined) return previous;
      const vertex = output.positions.length / 3;
      resident.set(key, vertex);
      const gather = (values: readonly number[], width: number): number[] =>
        Array.from({ length: width }, (_, axis) =>
          values[a * width + axis] + t * (values[b * width + axis] - values[a * width + axis]));
      output.positions.push(...gather(mesh.positions, 3));
      if (mesh.normals !== null) {
        const normal = gather(mesh.normals, 3);
        const length = Math.hypot(...normal);
        if (!(length > 0) || !Number.isFinite(length))
          throw new Error("Skin material boundary has no finite nonzero normal.");
        output.normals!.push(...normal.map((value) => value / length));
      }
      if (mesh.uvs !== null) output.uvs!.push(...gather(mesh.uvs, 2));
      if (mesh.colors !== undefined) output.colors!.push(...gather(mesh.colors, 3));
      if (mesh.reliefWeights !== undefined) output.reliefWeights!.push(...gather(mesh.reliefWeights, 1));
      if (output.physicalVertices !== undefined) {
        const original = physical(a);
        const other = physical(b);
        let sample: IAutoMovieMeshPhysicalSource | undefined = original;
        if (a !== b) {
          if (original === undefined || other === undefined)
            throw new Error("Registered skin material crossing needs both actual source parents.");
          sample = { domain: "skin-material-edge:" + JSON.stringify([
            original.domain, original.id, other.domain, other.id, t,
          ]), id: 0 };
        }
        if (sample === undefined) output.physicalVertices.vertices.push(null);
        else {
          output.physicalVertices.vertices.push(output.physicalVertices.sources.length);
          output.physicalVertices.sources.push({ ...sample });
        }
      }
      return vertex;
    };
    for (let at = 0; at < mesh.indices!.length; at += 3) {
      const triangle = mesh.indices!.slice(at, at + 3);
      if (covered && !triangle.some((vertex) => field[vertex] > 0)) continue;
      const polygon: number[] = [];
      for (let corner = 0; corner < 3; corner++) {
        const a = triangle[corner], b = triangle[(corner + 1) % 3];
        const insideA = covered ? field[a] >= 0 : field[a] <= 0;
        const insideB = covered ? field[b] >= 0 : field[b] <= 0;
        if (insideA) polygon.push(emit(a, a));
        if (insideA !== insideB) polygon.push(emit(a, b));
      }
      const ringVertices = polygon.filter((vertex, at, rows) =>
        at === 0 || vertex !== rows[at - 1]);
      if (ringVertices.length > 1 && ringVertices[0] === ringVertices[ringVertices.length - 1]) ringVertices.pop();
      for (let corner = 1; (corner + 1) < ringVertices.length; corner++)
        output.indices!.push(ringVertices[0], ringVertices[corner], ringVertices[corner + 1]);
    }
    return output;
  };
  return { uncovered: make(false), covered: make(true) };
}
