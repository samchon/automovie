import type { IAutoMovieHumanFaceBasis } from "@automovie/human";

type Surface = IAutoMovieHumanFaceBasis["surfaces"][number];

/**
 * Seal every boundary loop of at most `maximumRingVertices` vertices with a
 * fan wound to give its component positive volume; return the closure
 * triangles over resident vertex ids and what was sealed or left open.
 */
export function sealCrownRings(
  surface: Surface,
  maximumRingVertices: number,
): {
  closure: number[];
  sealedRings: number[];
  openLoops: number[];
  /** Resident triangles of every sealed component, for a closed crown-only query. */
  sealedTriangles: number[];
} {
  const welded = new Map<string, number>();
  const representative: number[] = [];
  const id = new Array<number>(surface.positions.length / 3);
  for (let v = 0; v * 3 < surface.positions.length; v++) {
    const key = surface.positions.slice(3 * v, 3 * v + 3).join(",");
    let index = welded.get(key);
    if (index === undefined) {
      index = representative.length;
      welded.set(key, index);
      representative.push(v);
    }
    id[v] = index;
  }
  const triangles: number[][] = [];
  for (let at = 0; at < surface.indices.length; at += 3)
    triangles.push(surface.indices.slice(at, at + 3).map((v) => id[v]));
  // Components by shared welded vertices.
  const parent = representative.map((_, index) => index);
  const find = (a: number): number => {
    while (parent[a] !== a) {
      parent[a] = parent[parent[a]];
      a = parent[a];
    }
    return a;
  };
  for (const [a, b, c] of triangles) {
    parent[find(a)] = find(b);
    parent[find(b)] = find(c);
  }
  const edges = new Map<string, { count: number; from: number; to: number }>();
  for (const triangle of triangles)
    for (let corner = 0; corner < 3; corner++) {
      const from = triangle[corner];
      const to = triangle[(corner + 1) % 3];
      const key = from < to ? `${from}:${to}` : `${to}:${from}`;
      const edge = edges.get(key) ?? { count: 0, from, to };
      edge.count++;
      edges.set(key, edge);
    }
  // Boundary edges keep the direction their single face gave them; a ring is
  // walked along that direction, so a cap triangle that traverses each ring
  // edge the other way pairs with the face oppositely, which is what the
  // sheet query admits.
  const outgoing = new Map<number, number[]>();
  const incoming = new Map<number, number>();
  for (const edge of edges.values()) {
    if (edge.count !== 1) continue;
    const list = outgoing.get(edge.from) ?? [];
    list.push(edge.to);
    outgoing.set(edge.from, list);
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
  }
  const visited = new Set<number>();
  const loops: number[][] = [];
  for (const start of outgoing.keys()) {
    if (visited.has(start)) continue;
    const loop: number[] = [];
    let current = start;
    for (;;) {
      const next = outgoing.get(current);
      if (
        next === undefined ||
        next.length !== 1 ||
        incoming.get(current) !== 1
      )
        throw new Error(
          `${surface.id} has a boundary vertex on more than two boundary edges; rings must be simple.`,
        );
      // Every boundary vertex has one edge in and one out, so the walk from
      // `start` is one cycle and returns there.
      if (current === start && loop.length > 0) break;
      visited.add(current);
      loop.push(current);
      current = next[0];
    }
    loops.push(loop);
  }
  const position = (welded: number): number[] =>
    surface.positions.slice(
      3 * representative[welded],
      3 * representative[welded] + 3,
    );
  const volume = (list: readonly number[][]): number =>
    list.reduce((total, [a, b, c]) => {
      const [p, q, r] = [position(a), position(b), position(c)];
      return (
        total +
        (p[0] * (q[1] * r[2] - q[2] * r[1]) -
          p[1] * (q[0] * r[2] - q[2] * r[0]) +
          p[2] * (q[0] * r[1] - q[1] * r[0])) /
          6
      );
    }, 0);
  const closure: number[] = [];
  const sealedRings: number[] = [];
  const openLoops: number[] = [];
  const sealedComponents = new Set<number>();
  for (const loop of loops) {
    if (loop.length > maximumRingVertices) {
      openLoops.push(loop.length);
      continue;
    }
    const component = find(loop[0]);
    const own = triangles.filter(([a]) => find(a) === component);
    const fan = loop
      .slice(1, -1)
      .map((_, i) => [loop[0], loop[i + 2], loop[i + 1]]);
    if (volume([...own, ...fan]) <= 0)
      throw new Error(
        `${surface.id} has an inward-wound crown; a collider must face outward.`,
      );
    for (const triangle of fan)
      closure.push(...triangle.map((welded) => representative[welded]));
    sealedRings.push(loop.length);
    sealedComponents.add(component);
  }
  // A component without any boundary is closed as it stands and counts as
  // sealed, so a globe closed by the source joins the crown-only query.
  const bounded = new Set<number>();
  for (const vertex of outgoing.keys()) bounded.add(find(vertex));
  for (const triangle of triangles)
    if (!bounded.has(find(triangle[0])))
      sealedComponents.add(find(triangle[0]));
  const sealedTriangles: number[] = [];
  triangles.forEach((triangle, at) => {
    if (sealedComponents.has(find(triangle[0])))
      sealedTriangles.push(...surface.indices.slice(3 * at, 3 * at + 3));
  });
  return { closure, sealedRings, openLoops, sealedTriangles };
}
