/** Read every oriented boundary cycle of an actual triangle subpopulation. */
export function readHumanSourceAttachmentLoops(indices: readonly number[], population: ReadonlySet<number>): number[][] {
  const edges = new Map<string, number[]>();
  for (const triangle of population) for (let corner = 0; corner < 3; corner++) {
    const a = indices[3 * triangle + corner], b = indices[3 * triangle + (corner + 1) % 3];
    const key = a < b ? `${a}:${b}` : `${b}:${a}`, prior = edges.get(key);
    if (prior === undefined) edges.set(key, [a, b]);
    else if (prior.length !== 2 || prior[0] !== b || prior[1] !== a) throw new Error("Attachment domain incidence is nonmanifold or inconsistently oriented.");
    else prior.push(a, b);
  }
  const next = new Map<number, number>();
  for (const edge of edges.values()) if (edge.length === 2) {
    if (next.has(edge[0])) throw new Error("Attachment domain boundary branches at a source vertex.");
    next.set(edge[0], edge[1]);
  }
  const seen = new Set<number>(), loops: number[][] = [];
  for (const first of next.keys()) {
    if (seen.has(first)) continue;
    const loop = [first]; seen.add(first);
    let vertex = next.get(first);
    while (vertex !== first) {
      if (vertex === undefined || seen.has(vertex)) throw new Error("Attachment domain boundary is not a simple closed source path.");
      seen.add(vertex); loop.push(vertex); vertex = next.get(vertex);
    }
    loops.push(loop);
  }
  return loops;
}
