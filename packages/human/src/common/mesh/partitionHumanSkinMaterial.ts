import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshPhysicalSource,
} from "@automovie/interface";

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
 *
 * @evidence contracts/common.md#principled-implementation Linear coverage clips triangles into complementary static materials; canonical physical-edge order gives identical crossings, exact-zero endpoints retain identity and attributes interpolate separately. Downstream precision/topology still admit the result.
 * @evidence contracts/common.md#clear-and-simple-design The owner partitions actual performed coverage while field construction, garment lifting and source qualification remain with callers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No offset, retained duplicate triangle, expected coverage count or garment-fit claim is introduced; invalid correspondence/crossing normals refuse.
 * @evidence contracts/common.md#meaningful-documentation The comment gives zero-thickness partitioning, crossing/zero identity, independent aliases, winding and downstream sliver limits.
 * @evidence contracts/performance.md#efficient-algorithms For V vertices and T triangles, validation and two bounded clipping passes use O(V+T) expected map work plus source-key bytes; triangle clipping bounds output by O(V+T).
 * @evidence contracts/performance.md#reuse-equivalent-work Each side reuses emitted edges through its resident Map and physical parent/fraction identity agrees across sides; changing mesh/field inputs are not persistently cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Two output meshes own arrays/source tables; side-local Maps expire after construction without handles, background tasks or persistent state.
 */
export function partitionHumanSkinMaterial(
  input: IHumanSkinMaterialPartitionInput,
): IHumanSkinMaterialPartition {
  const { mesh, field, sources }: IHumanSkinMaterialPartitionInput = input;
  if (
    mesh.skin !== null ||
    mesh.indices === null ||
    field.length !== mesh.positions.length / 3 ||
    sources.length !== field.length ||
    !field.every(Number.isFinite)
  )
    throw new Error(
      "Skin material partition needs a static indexed mesh and matching finite source coverage.",
    );
  if (mesh.physicalVertices !== undefined)
    resolveAutoMovieMeshPhysicalVertices(mesh);
  const physical: (
    vertex: number,
  ) => IAutoMovieMeshPhysicalSource | undefined = (
    vertex: number,
  ): IAutoMovieMeshPhysicalSource | undefined => {
    const reference: number | null | undefined =
      mesh.physicalVertices?.vertices[vertex];
    return reference === undefined || reference === null
      ? undefined
      : mesh.physicalVertices!.sources[reference];
  };
  const identity: (vertex: number) => string = (vertex: number): string => {
    const source: IAutoMovieMeshPhysicalSource | undefined = physical(vertex);
    return source === undefined
      ? "native:" + sources[vertex]
      : JSON.stringify([source.domain, source.id]);
  };
  const make: (covered: boolean) => IAutoMovieMesh = (
    covered: boolean,
  ): IAutoMovieMesh => {
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
            physicalVertices: { sources: [], vertices: [] },
          }),
    };
    const resident: Map<string, number> = new Map<string, number>();
    const emit: (first: number, second: number) => number = (
      first: number,
      second: number,
    ): number => {
      let a: number = first;
      let b: number = second;
      if (field[a] === 0) b = a;
      else if (field[b] === 0) a = b;
      if (a !== b && identity(a) > identity(b)) [a, b] = [b, a];
      const t: number = a === b ? 0 : field[a] / (field[a] - field[b]);
      const key: string = a + "/" + b;
      const previous: number | undefined = resident.get(key);
      if (previous !== undefined) return previous;
      const vertex: number = output.positions.length / 3;
      resident.set(key, vertex);
      const gather: (values: readonly number[], width: number) => number[] = (
        values: readonly number[],
        width: number,
      ): number[] =>
        Array.from(
          { length: width },
          (_value: unknown, axis: number): number =>
            values[a * width + axis] +
            t * (values[b * width + axis] - values[a * width + axis]),
        );
      output.positions.push(...gather(mesh.positions, 3));
      if (mesh.normals !== null) {
        const normal: number[] = gather(mesh.normals, 3);
        const length: number = Math.hypot(...normal);
        if (!(length > 0) || !Number.isFinite(length))
          throw new Error(
            "Skin material boundary has no finite nonzero normal.",
          );
        output.normals!.push(
          ...normal.map((value: number): number => value / length),
        );
      }
      if (mesh.uvs !== null) output.uvs!.push(...gather(mesh.uvs, 2));
      if (mesh.colors !== undefined)
        output.colors!.push(...gather(mesh.colors, 3));
      if (mesh.reliefWeights !== undefined)
        output.reliefWeights!.push(...gather(mesh.reliefWeights, 1));
      if (output.physicalVertices !== undefined) {
        const original: IAutoMovieMeshPhysicalSource | undefined = physical(a);
        const other: IAutoMovieMeshPhysicalSource | undefined = physical(b);
        let sample: IAutoMovieMeshPhysicalSource | undefined = original;
        if (a !== b) {
          if (original === undefined || other === undefined)
            throw new Error(
              "Registered skin material crossing needs both actual source parents.",
            );
          sample = {
            domain:
              "skin-material-edge:" +
              JSON.stringify([
                original.domain,
                original.id,
                other.domain,
                other.id,
                t,
              ]),
            id: 0,
          };
        }
        if (sample === undefined) output.physicalVertices.vertices.push(null);
        else {
          output.physicalVertices.vertices.push(
            output.physicalVertices.sources.length,
          );
          output.physicalVertices.sources.push({ ...sample });
        }
      }
      return vertex;
    };
    for (let at: number = 0; at < mesh.indices!.length; at += 3) {
      const triangle: number[] = mesh.indices!.slice(at, at + 3);
      if (
        covered &&
        !triangle.some((vertex: number): boolean => field[vertex] > 0)
      )
        continue;
      const polygon: number[] = [];
      for (let corner: number = 0; corner < 3; corner++) {
        const a: number = triangle[corner];
        const b: number = triangle[(corner + 1) % 3];
        const insideA: boolean = covered ? field[a] >= 0 : field[a] <= 0;
        const insideB: boolean = covered ? field[b] >= 0 : field[b] <= 0;
        if (insideA) polygon.push(emit(a, a));
        if (insideA !== insideB) polygon.push(emit(a, b));
      }
      const ringVertices: number[] = polygon.filter(
        (vertex: number, at: number, rows: number[]): boolean =>
          at === 0 || vertex !== rows[at - 1],
      );
      if (
        ringVertices.length > 1 &&
        ringVertices[0] === ringVertices[ringVertices.length - 1]
      )
        ringVertices.pop();
      for (let corner: number = 1; corner + 1 < ringVertices.length; corner++)
        output.indices!.push(
          ringVertices[0],
          ringVertices[corner],
          ringVertices[corner + 1],
        );
    }
    return output;
  };
  return { uncovered: make(false), covered: make(true) };
}
