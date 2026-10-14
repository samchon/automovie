import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBasisSurfaceSag } from "../structures/surface/IAutoMovieHumanBodyBasisSurfaceSag";
import type { IHumanBodySurfaceSagInput } from "./IHumanBodySurfaceSagInput";

type Surface = IAutoMovieHumanBodyBasis["surfaces"][number];

/**
 * Apply the authored quasi-static exterior gravity response after skinning.
 *
 * Rest skin already carries its authored hang. Outward rest-minus-lean thickness along the rest normal supplies a nonnegative metre proxy. The displacement is gain times that thickness times caller-computed softness times (down minus the posed rest-down direction), where down is basis -Y. Source channels define softness; this function does not measure tissue elasticity.
 *
 * Each declared sweep averages the displacement halfway toward adjacent vertices while holding open-boundary vertices at their skinned positions. A collapsed area normal contributes zero projected thickness. Direct callers supply the admitted surface topology, policy and aligned same-revision arrays, including a nonnegative safe-integer sweep count so the binary64 loop counter advances to completion. This indexing premise does not bound practical execution time.
 *
 * Carbonaro et al. (2012, https://air.unimi.it/handle/2434/174353) report median breast-lesion displacements of about 3 to 6 cm between prone and supine MRI in eleven patients. Those lesion readings do not determine this gain or a full skin field. Rest-minus-lean compares authored exterior skins rather than imaged fat or muscle boundaries; it supplies no bone collision, compression or volume-preserving contact law.
 *
 * @evidence contracts/common.md#principled-implementation Area-weighted rest normals project the source-rest/lean difference into nonnegative thickness; declared gain and softness scale changed gravity direction, then fixed-boundary half-step diffusion smooths that displacement.
 * @evidence contracts/common.md#clear-and-simple-design Compilation prepares adjacency and open-rim flags; a document pass builds normals and displacement, applies declared sweeps and returns the displaced skinned copy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rest/lean exterior difference and authored gain remain a proxy, not an imaged tissue boundary or elasticity measurement; collapsed normals contribute zero and no collision or volume law is asserted.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies basis metre axes, channel-owned softness, sweep policy, boundary behavior, caller premises and the clinical reading's limited relevance.
 * @evidence contracts/performance.md#efficient-algorithms Compilation traverses V vertices and T faces; each evaluation costs O(T+V+sweeps times (V+E)) with linear-size normal/displacement buffers and retained adjacency.
 * @evidence contracts/performance.md#reuse-equivalent-work Basis adjacency and rim flags are reused across documents, while caller-owned rest/lean evaluation is shared with appearance and current normal/displacement fields are recomputed for the actual shape.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains surface policy and adjacency until unreachable; sweep buffers and rest normals expire after evaluation, only returned positions escape, and no external handle or task is acquired.
 */
export function createHumanBodySurfaceSag(
  surface: Surface,
  sag: IAutoMovieHumanBodyBasisSurfaceSag,
): (props: IHumanBodySurfaceSagInput) => number[] {
  const count: number = surface.positions.length / 3;
  const sets: Set<number>[] = Array.from(
    { length: count },
    (): Set<number> => new Set<number>(),
  );
  const edges: Map<string, number> = new Map<string, number>();
  for (let t: number = 0; t < surface.indices.length; t += 3)
    for (let k: number = 0; k < 3; k++) {
      const a: number = surface.indices[t + k];
      const b: number = surface.indices[t + ((k + 1) % 3)];
      sets[a].add(b);
      sets[b].add(a);
      const key: string = a < b ? `${a},${b}` : `${b},${a}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  const neighbours: number[][] = sets.map((set: Set<number>): number[] => [
    ...set,
  ]);
  const held: Uint8Array = new Uint8Array(count);
  for (const [key, triangles] of edges)
    if (triangles === 1) for (const v of key.split(",")) held[Number(v)] = 1;

  return ({
    rest,
    lean,
    skinned,
    hanging,
    softness,
  }: IHumanBodySurfaceSagInput): number[] => {
    const normals: Float64Array = new Float64Array(count * 3);
    for (let t: number = 0; t < surface.indices.length; t += 3) {
      const [a, b, c]: number[] = [0, 1, 2].map(
        (k: number): number => surface.indices[t + k],
      );
      const e1: number[] = [0, 1, 2].map(
        (k: number): number => rest[b * 3 + k] - rest[a * 3 + k],
      );
      const e2: number[] = [0, 1, 2].map(
        (k: number): number => rest[c * 3 + k] - rest[a * 3 + k],
      );
      const n: number[] = [
        e1[1] * e2[2] - e1[2] * e2[1],
        e1[2] * e2[0] - e1[0] * e2[2],
        e1[0] * e2[1] - e1[1] * e2[0],
      ];
      for (const v of [a, b, c])
        for (let k: number = 0; k < 3; k++) normals[v * 3 + k] += n[k];
    }
    let field: Float64Array = new Float64Array(count * 3);
    for (let v: number = 0; v < count; v++) {
      if (held[v] === 1) continue;
      const size: number =
        Math.hypot(normals[v * 3], normals[v * 3 + 1], normals[v * 3 + 2]) || 1;
      let thickness: number = 0;
      for (let k: number = 0; k < 3; k++)
        thickness +=
          ((rest[v * 3 + k] - lean[v * 3 + k]) * normals[v * 3 + k]) / size;
      const compliance: number = sag.gain * Math.max(0, thickness) * softness;
      field[v * 3] = compliance * (0 - hanging[v * 3]);
      field[v * 3 + 1] = compliance * (-1 - hanging[v * 3 + 1]);
      field[v * 3 + 2] = compliance * (0 - hanging[v * 3 + 2]);
    }
    for (let sweep: number = 0; sweep < sag.sweeps; sweep++) {
      const next: Float64Array = new Float64Array(field.length);
      for (let v: number = 0; v < count; v++) {
        const around: number[] = neighbours[v];
        for (let k: number = 0; k < 3; k++) {
          let sum: number = 0;
          for (const u of around) sum += field[u * 3 + k];
          next[v * 3 + k] =
            held[v] === 1
              ? 0
              : around.length === 0
                ? field[v * 3 + k]
                : 0.5 * field[v * 3 + k] + (0.5 * sum) / around.length;
        }
      }
      field = next;
    }
    return skinned.map((value: number, i: number): number => value + field[i]);
  };
}
