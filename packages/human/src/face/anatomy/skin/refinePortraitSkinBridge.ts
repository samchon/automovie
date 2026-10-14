/**
 * Retriangulate a skin annulus after adding original-surface interior samples.
 * Boundary edges are retained. Interior diagonals use the planar Delaunay test
 * so the inserted samples do not remain three-valence triangle fans. All input
 * triangles form a non-overlapping manifold, counterclockwise in the admitted
 * XY attachment chart. The caller owns that annulus admission. Incomplete,
 * nonfinite or numerically degenerate triangles are refused here.
 * Positions are head millimetres; the caller provides the original skin query.
 * The normalized floating incircle test uses a relative 1e-12 threshold;
 * nearly cocircular edges can remain unflipped. This is not an exact-predicate
 * Delaunay certificate or a bounded-pass solver, and host annulus validity
 * remains a caller premise.
 *
 * @evidence contracts/common.md#principled-implementation One original-surface depth sample per admitted CCW triangle creates interior fan vertices; Lawson-style convex edge flips improve the normalized incircle criterion while retaining boundary edges and source depth.
 * @evidence contracts/common.md#clear-and-simple-design Sampling and planar retriangulation remain one bridge owner, while its eye-component caller supplies original depth and the shared annulus admission before committing cage changes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Original XYZ remains copied and unmodified; the relative 1e-12 incircle threshold is a floating construction convention, not exact Delaunay or anatomical accuracy. No iteration cap silently accepts unfinished flips.
 * @evidence contracts/common.md#meaningful-documentation The prose gives millimetre frame, caller manifold/XY premises, finite-sample refusals, boundary preservation and approximate-predicate/pass-count limits.
 * @evidence contracts/performance.md#efficient-algorithms T input faces add T samples and 3T faces; each pass rebuilds O(T) adjacency so touched faces never reuse stale edge records. Total cost depends on required flip passes with no stated small pass bound, and depth-query cost belongs to the supplied original-surface sampler.
 * @evidence contracts/performance.md#reuse-equivalent-work Original sample depths and normalized chart coordinates are computed once; adjacency is rebuilt after each changing pass because its incidence differs, and no result is reused across changed annuli.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owned positions/faces grow only by one sample per input triangle; pass maps are replaced and final arrays belong to the caller. Refusal changes no input mesh and retains no task/handle globally.
 */
export function refinePortraitSkinBridge(
  input: readonly (readonly number[])[],
  indices: readonly number[],
  depth: (x: number, y: number) => number,
): { positions: number[][]; indices: number[] } {
  if (
    input.some(
      (p: readonly number[]): boolean =>
        p.length !== 3 || !p.every(Number.isFinite),
    ) ||
    indices.length % 3 !== 0 ||
    indices.some(
      (id: number): boolean =>
        !Number.isInteger(id) || id < 0 || id >= input.length,
    )
  )
    throw new Error(
      "Skin bridge needs finite XYZ vertices and complete valid triangle indices.",
    );
  const positions: number[][] = input.map((p: readonly number[]): number[] => [
    ...p,
  ]);
  const scale: number =
    input.reduce(
      (maximum: number, p: readonly number[]): number =>
        Math.max(maximum, Math.abs(p[0]), Math.abs(p[1])),
      0,
    ) || 1;
  const chart: number[][] = input.map((p: readonly number[]): number[] => [
    p[0] / scale,
    p[1] / scale,
  ]);
  const area: (a: number, b: number, c: number) => number = (
    a: number,
    b: number,
    c: number,
  ): number =>
    (chart[b][0] - chart[a][0]) * (chart[c][1] - chart[a][1]) -
    (chart[b][1] - chart[a][1]) * (chart[c][0] - chart[a][0]);
  const faces: number[][] = [];
  for (let i: number = 0; i < indices.length; i += 3) {
    const face: number[] = indices.slice(i, i + 3);
    if (area(face[0], face[1], face[2]) <= 0)
      throw new Error(
        "Skin bridge needs counterclockwise nondegenerate XY triangles.",
      );
    const x: number = face.reduce(
      (sum: number, id: number): number => sum + positions[id][0] / 3,
      0,
    );
    const y: number = face.reduce(
      (sum: number, id: number): number => sum + positions[id][1] / 3,
      0,
    );
    const z: number = depth(x, y);
    if (!Number.isFinite(z))
      throw new Error(
        "Skin bridge samples need finite original-surface depth.",
      );
    const center: number = positions.push([x, y, z]) - 1;
    chart.push([x / scale, y / scale]);
    for (let edge: number = 0; edge < 3; edge++) {
      if (area(face[edge], face[(edge + 1) % 3], center) <= 0)
        throw new Error(
          "Skin bridge interior samples need representable XY positions.",
        );
      faces.push([face[edge], face[(edge + 1) % 3], center]);
    }
  }
  // A pass rebuilds adjacency after flips, never using an edge record whose
  // incident face has already changed. Strict positive improvement excludes
  // cocircular oscillation. Every accepted Lawson flip improves the planar
  // triangulation; a complete pass without an eligible flip is the fixed point.
  for (;;) {
    const edges: Map<
      string,
      { face: number; a: number; b: number; c: number }[]
    > = new Map<string, { face: number; a: number; b: number; c: number }[]>();
    for (let f: number = 0; f < faces.length; f++)
      for (let e: number = 0; e < 3; e++) {
        const [a, b, c]: [number, number, number] = [
          faces[f][e],
          faces[f][(e + 1) % 3],
          faces[f][(e + 2) % 3],
        ];
        const key: string = a < b ? `${a}/${b}` : `${b}/${a}`;
        const edge: { face: number; a: number; b: number; c: number }[] =
          edges.get(key) ?? [];
        edge.push({ face: f, a, b, c });
        edges.set(key, edge);
      }
    const touched: Set<number> = new Set<number>();
    let changed: boolean = false;
    for (const edge of edges.values()) {
      if (
        edge.length !== 2 ||
        edge.some(
          (e: { face: number; a: number; b: number; c: number }): boolean =>
            touched.has(e.face),
        )
      )
        continue;
      const { a, b, c }: { face: number; a: number; b: number; c: number } =
          edge[0],
        d: number = edge[1].c;
      if (area(c, d, b) <= 0 || area(d, c, a) <= 0) continue;
      const delta: number[][] = [a, b, c].map((id: number): number[] => [
        chart[id][0] - chart[d][0],
        chart[id][1] - chart[d][1],
      ]);
      const extent: number = Math.max(...delta.flat().map(Math.abs));
      const q: number[][] = delta.map((p: number[]): number[] =>
        p.map((v: number): number => v / extent),
      );
      const [u, v, w]: number[][] = q,
        sq: (p: number[]) => number = (p: number[]): number =>
          p[0] * p[0] + p[1] * p[1];
      const determinant: number =
        sq(u) * (v[0] * w[1] - v[1] * w[0]) -
        sq(v) * (u[0] * w[1] - u[1] * w[0]) +
        sq(w) * (u[0] * v[1] - u[1] * v[0]);
      const radiusSquared: number = Math.max(...q.map(sq));
      if (determinant <= 1e-12 * radiusSquared * radiusSquared) continue;
      faces[edge[0].face] = [c, d, b];
      faces[edge[1].face] = [d, c, a];
      edge.forEach(
        (e: { face: number; a: number; b: number; c: number }): Set<number> =>
          touched.add(e.face),
      );
      changed = true;
    }
    if (!changed) return { positions, indices: faces.flat() };
  }
}
