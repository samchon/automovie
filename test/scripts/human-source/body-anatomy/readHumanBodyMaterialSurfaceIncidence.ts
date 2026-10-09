/** Full-population incidence refusal and its observed count. @author Samchon */
interface IncidenceFailure { reason: string; count: number }
/** Original first face and accumulated unoriented-edge incidence. @author Samchon */
interface IncidenceEdge { first: number; count: number; balance: number }
/** Exact aliases, original component faces and all incidence failures. @author Samchon */
interface SurfaceIncidenceReading {
  qualified: boolean; failures: IncidenceFailure[];
  aliases: Int32Array; representatives: Int32Array; components: Int32Array[];
}

/**
 * Exact-coordinate alias incidence of supplied source triangles. Aliases are
 * bookkeeping only: positions, shading vertices and emitted indices stay intact.
 * Every edge needs opposite incidences, every vertex link one cycle and every
 * triangle finite nonzero area. No component-volume sign or embedding is inferred.
 */
export function readHumanBodyMaterialSurfaceIncidence(positions: ArrayLike<number>, indices: ArrayLike<number>): SurfaceIncidenceReading {
  if (positions.length === 0 || positions.length % 3 || indices.length === 0 || indices.length % 3)
    throw new Error("Source incidence needs nonempty complete XYZ and triangles.");
  const aliases = new Int32Array(positions.length / 3), representatives: number[] = [];
  const keys = new Map<string, number>();
  for (let vertex = 0; vertex < aliases.length; vertex++) {
    const point = [positions[3 * vertex], positions[3 * vertex + 1], positions[3 * vertex + 2]];
    if (!point.every(Number.isFinite)) throw new Error("Source incidence has nonfinite coordinates.");
    const key = point.join("/");
    let alias = keys.get(key);
    if (alias === undefined) { alias = keys.size; keys.set(key, alias); representatives.push(vertex); }
    aliases[vertex] = alias;
  }
  const faces = indices.length / 3, parent = Int32Array.from({ length: faces }, (_, i) => i);
  const edges = new Map<string, IncidenceEdge>();
  const links = Array.from({ length: representatives.length }, () => new Map<number, number[]>());
  const root = (id: number): number => {
    while (parent[id] !== id) { parent[id] = parent[parent[id]]; id = parent[id]; }
    return id;
  };
  let collapsed = 0;
  for (let face = 0; face < faces; face++) {
    const ids = [indices[3 * face], indices[3 * face + 1], indices[3 * face + 2]];
    if (ids.some((id) => !Number.isSafeInteger(id) || id < 0 || id >= aliases.length))
      throw new Error("Source incidence has an invalid triangle ordinal.");
    const triangle = ids.map((id) => aliases[id]);
    const a = ids.map((id) => [positions[3 * id], positions[3 * id + 1], positions[3 * id + 2]]);
    const u = a[1].map((v, i) => v - a[0][i]), v = a[2].map((v, i) => v - a[0][i]);
    const area = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
    if (!area.every(Number.isFinite) || Math.hypot(...area) === 0) collapsed++;
    for (let corner = 0; corner < 3; corner++) {
      const first = triangle[corner], last = triangle[(corner + 1) % 3];
      const key = `${Math.min(first, last)}/${Math.max(first, last)}`;
      const edge = edges.get(key);
      if (edge === undefined) edges.set(key, { first: face, count: 1, balance: first < last ? 1 : -1 });
      else { edge.count++; edge.balance += first < last ? 1 : -1; parent[root(face)] = root(edge.first); }
      const left = triangle[(corner + 1) % 3], right = triangle[(corner + 2) % 3], graph = links[first];
      graph.set(left, [...(graph.get(left) ?? []), right]);
      graph.set(right, [...(graph.get(right) ?? []), left]);
    }
  }
  let badLinks = 0;
  for (const graph of links) {
    if (graph.size === 0) continue;
    const visited = new Set<number>(), pending = [graph.keys().next().value!];
    while (pending.length) { const vertex = pending.pop()!; if (visited.has(vertex)) continue; visited.add(vertex); pending.push(...graph.get(vertex)!); }
    if (visited.size !== graph.size || [...graph.values()].some((values) => values.length !== 2)) badLinks++;
  }
  const groups = new Map<number, number[]>();
  for (let face = 0; face < faces; face++) {
    const id = root(face);
    let group = groups.get(id);
    if (group === undefined) { group = []; groups.set(id, group); }
    group.push(face);
  }
  const failures: IncidenceFailure[] = [];
  const counts = [
    ["edges-not-two-incident", [...edges.values()].filter((edge) => edge.count !== 2).length],
    ["inconsistent-edge-orientation", [...edges.values()].filter((edge) => edge.balance !== 0).length],
    ["vertex-links-not-single-cycles", badLinks], ["collapsed-triangles", collapsed],
  ] as const;
  for (const [reason, count] of counts) if (count) failures.push({ reason, count });
  const components = [...groups.values()].sort((a, b) => a[0] - b[0]).map((group) => Int32Array.from(group));
  return { qualified: failures.length === 0, failures, aliases, representatives: Int32Array.from(representatives), components };
}
