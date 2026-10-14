import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";

type Surface = IAutoMovieHumanBodyBasis["surfaces"][number];

/**
 * Iterative rest-detail filtering on the shared connected skin in metres.
 *
 * The numerical policy has passed surface admission: sweep and ring counts are safe integers, so incrementing the counters can advance to their limits. Direct callers supply the same bounds. Both arrays have the surface's vertex order and length. Each is smoothed by equal-neighbour half steps; the rest residual is expressed in the smoothed normal/tangent frame and restored in the posed frame. A collapsed frame retains the input posed point. The mask is derived from skin influences and topology, not a tissue measurement or contact law. One distinct positive bone influence and open rims are fixed support; mask diffusion cannot activate them. Mixed weights are normalized by their sum, as skinning is, so common-scale changes preserve the mask apart from floating-point roundoff. Duplicate slots name one influence, not several bones.
 *
 * Preparation owns a topology snapshot and the four numerical policy values. A new rest shape is evaluated each call, with no cached geometry. Inputs are unchanged. Aliased rest/posed arrays and an empty active set return the posed array itself; other calls return owned positions. The output rim is held, while intermediate smoothing still moves rim samples. This is not the smoothing-time border pin of the Autodesk node.
 *
 * Autodesk's deltaMush node documents equal-weight iterative Laplacian filtering, local displacements and smoothed frames: https://help.autodesk.com/cloudhelp/ENU/MayaCRE-Tech-Docs/Nodes/deltaMush.html This is the explicitly specified uniform-Laplacian, local-frame and skin-weight policy. Its tangent follows the first sorted neighbour, so changing vertex identities changes that reference; a changed basis needs recompilation. It does not prove volume, clearance, nonpenetration or anatomical motion.
 *
 * @evidence contracts/common.md#principled-implementation Equal-neighbour half-step smoothing builds rest/posed frames, then transports the rest residual under a skin-weight mask whose fixed single-influence vertices and open rims remain inactive.
 * @evidence contracts/common.md#clear-and-simple-design Topology and mask compile once; each evaluation independently smooths rest and pose, forms local frames and blends reconstructed detail into the posed positions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A collapsed frame preserves its posed point and no contact, volume or anatomical proof is inferred; sorted-neighbour tangents and unpinned intermediate rim smoothing are declared implementation policy.
 * @evidence contracts/common.md#meaningful-documentation The comment states admitted policy, source vertex order, alias-return cases, topology snapshot, boundary differences and the fixed model's limitations.
 * @evidence contracts/performance.md#efficient-algorithms Compilation traverses faces and sorted one-rings plus spread-ring diffusion; each requested evaluation performs two O(iterations times (V+E)) smoothing passes, face normal passes and active-vertex reconstruction, using O(V+E) retained topology.
 * @evidence contracts/performance.md#reuse-equivalent-work Compiled adjacency, boundary flags and influence mask are reused across documents; alias and empty-active cases return immediately, while changed rest geometry is recalculated rather than served from an incompatible cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains its copied incidence, neighbours and mask; per-call smoothed/frame buffers expire except owned output, and unreachable compilation releases references without handles or tasks.
 */
export function createHumanBodySurfaceMush(
  surface: Surface,
  mush: NonNullable<Surface["mush"]>,
): (rest: number[], posed: number[]) => number[] {
  const count: number = surface.positions.length / 3;
  const indices: number[] = surface.indices.slice();
  const { iterations, blendWidth, spreadRings, spreadDecay }: typeof mush =
    mush;
  const sets: Set<number>[] = Array.from(
    { length: count },
    (): Set<number> => new Set<number>(),
  );
  const edges: Map<string, number> = new Map<string, number>();
  for (let t: number = 0; t < indices.length; t += 3)
    for (let k: number = 0; k < 3; k++) {
      const a: number = indices[t + k];
      const b: number = indices[t + ((k + 1) % 3)];
      sets[a].add(b);
      sets[b].add(a);
      const key: string = a < b ? `${a},${b}` : `${b},${a}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  const neighbours: number[][] = sets.map((set: Set<number>): number[] =>
    [...set].sort((a: number, b: number): number => a - b),
  );
  let mask: Float64Array = new Float64Array(count);
  const held: Uint8Array = new Uint8Array(count);
  for (let v: number = 0; v < count; v++) {
    const sums: Map<number, number> = new Map<number, number>();
    for (let q: number = 0; q < 4; q++) {
      const bone: number = surface.skin.boneIndices[v * 4 + q];
      const weight: number = surface.skin.weights[v * 4 + q];
      if (weight !== 0) sums.set(bone, (sums.get(bone) ?? 0) + weight);
    }
    if (sums.size <= 1) {
      held[v] = 1;
      continue;
    }
    const total: number = [...sums.values()].reduce(
      (sum: number, weight: number): number => sum + weight,
      0,
    );
    const largest: number = Math.max(...sums.values());
    mask[v] = Math.min(1, Math.max(0, (1 - largest / total) / blendWidth));
  }
  for (const [key, triangles] of edges)
    if (triangles === 1)
      for (const vertex of key.split(",")) {
        held[Number(vertex)] = 1;
        mask[Number(vertex)] = 0;
      }
  for (let ring: number = 0; ring < spreadRings; ring++) {
    const previous: Float64Array = mask;
    mask = previous.map((value: number, v: number): number =>
      held[v] === 1
        ? 0
        : neighbours[v].reduce(
            (most: number, u: number): number =>
              Math.max(most, spreadDecay * previous[u]),
            value,
          ),
    );
  }
  const active: number[] = [];
  for (let v: number = 0; v < count; v++) if (mask[v] > 0) active.push(v);

  const smooth: (positions: number[]) => Float64Array = (
    positions: number[],
  ): Float64Array => {
    let current: Float64Array = Float64Array.from(positions);
    for (let sweep: number = 0; sweep < iterations; sweep++) {
      const next: Float64Array = new Float64Array(current.length);
      for (let v: number = 0; v < count; v++) {
        const around: number[] = neighbours[v];
        for (let axis: number = 0; axis < 3; axis++) {
          if (around.length === 0) {
            next[v * 3 + axis] = current[v * 3 + axis];
            continue;
          }
          let sum: number = 0;
          for (const u of around) sum += current[u * 3 + axis];
          next[v * 3 + axis] =
            0.5 * current[v * 3 + axis] + (0.5 * sum) / around.length;
        }
      }
      current = next;
    }
    return current;
  };
  const normalsOf: (positions: Float64Array) => Float64Array = (
    positions: Float64Array,
  ): Float64Array => {
    const normals: Float64Array = new Float64Array(positions.length);
    for (let t: number = 0; t < indices.length; t += 3) {
      const [a, b, c]: number[] = [0, 1, 2].map(
        (k: number): number => indices[t + k],
      );
      const e1: number[] = [0, 1, 2].map(
        (k: number): number => positions[b * 3 + k] - positions[a * 3 + k],
      );
      const e2: number[] = [0, 1, 2].map(
        (k: number): number => positions[c * 3 + k] - positions[a * 3 + k],
      );
      const n: number[] = [
        e1[1] * e2[2] - e1[2] * e2[1],
        e1[2] * e2[0] - e1[0] * e2[2],
        e1[0] * e2[1] - e1[1] * e2[0],
      ];
      for (const v of [a, b, c])
        for (let k: number = 0; k < 3; k++) normals[v * 3 + k] += n[k];
    }
    return normals;
  };
  /** The smoothed surface's frame at a vertex: tangent, bitangent, normal. */
  const frameOf: (
    positions: Float64Array,
    normals: Float64Array,
    v: number,
  ) => number[][] | null = (
    positions: Float64Array,
    normals: Float64Array,
    v: number,
  ): number[][] | null => {
    const raw: number[] = [0, 1, 2].map(
      (k: number): number => normals[v * 3 + k],
    );
    const size: number = Math.hypot(raw[0], raw[1], raw[2]);
    const n: number[] = raw.map((value: number): number => value / size);
    // toward the first neighbour, the same one on every surface, so the rest
    // and posed frames name the same directions
    const u: number = neighbours[v][0] ?? v;
    const d: number[] = [0, 1, 2].map(
      (k: number): number => positions[u * 3 + k] - positions[v * 3 + k],
    );
    const along: number = d[0] * n[0] + d[1] * n[1] + d[2] * n[2];
    const projected: number[] = d.map(
      (value: number, k: number): number => value - along * n[k],
    );
    const length: number = Math.hypot(projected[0], projected[1], projected[2]);
    const t: number[] = projected.map(
      (value: number): number => value / length,
    );
    const b: number[] = [
      n[1] * t[2] - n[2] * t[1],
      n[2] * t[0] - n[0] * t[2],
      n[0] * t[1] - n[1] * t[0],
    ];
    const frame: number[][] = [t, b, n];
    // a collapsed neighbourhood (no normal, or no direction off it) has no
    // frame, and its vertex keeps the skinned position
    return frame.every((axis: number[]): boolean => axis.every(Number.isFinite))
      ? frame
      : null;
  };

  return (rest: number[], posed: number[]): number[] => {
    if (rest === posed || active.length === 0) return posed;
    const restSmooth: Float64Array = smooth(rest);
    const restNormals: Float64Array = normalsOf(restSmooth);
    const posedSmooth: Float64Array = smooth(posed);
    const posedNormals: Float64Array = normalsOf(posedSmooth);
    const out: number[] = posed.slice();
    for (const v of active) {
      const from: number[][] | null = frameOf(restSmooth, restNormals, v);
      const to: number[][] | null = frameOf(posedSmooth, posedNormals, v);
      if (from === null || to === null) continue;
      const d: number[] = [0, 1, 2].map(
        (k: number): number => rest[v * 3 + k] - restSmooth[v * 3 + k],
      );
      const local: number[] = from.map(
        (axis: number[]): number =>
          axis[0] * d[0] + axis[1] * d[1] + axis[2] * d[2],
      );
      for (let k: number = 0; k < 3; k++) {
        const mushed: number =
          posedSmooth[v * 3 + k] +
          local[0] * to[0][k] +
          local[1] * to[1][k] +
          local[2] * to[2][k];
        out[v * 3 + k] =
          posed[v * 3 + k] + mask[v] * (mushed - posed[v * 3 + k]);
      }
    }
    return out;
  };
}
