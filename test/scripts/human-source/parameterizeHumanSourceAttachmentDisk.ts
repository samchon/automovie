/**
 * Compile a triangulated disk with Tutte's positive uniform barycentric map.
 * The oriented boundary is placed on a strictly convex circle; interior
 * coordinates solve the symmetric Dirichlet graph Laplacian by preconditioned
 * conjugate gradients. CGAL's Surface Mesh Parameterization manual documents
 * the convex-boundary/positive-weight premises used here:
 * https://doc.cgal.org/latest/Surface_mesh_parameterization/index.html
 * These dimensionless material coordinates supply no anatomical metric.
 */
export function parameterizeHumanSourceAttachmentDisk(
  indices: readonly number[],
  count: number,
): number[] {
  const adjacency = Array.from({ length: count }, () => new Set<number>());
  const links = Array.from(
    { length: count },
    () => new Map<number, Set<number>>(),
  );
  const edges = new Map<string, number[]>();
  const key = (a: number, b: number): string =>
    a < b ? `${a}:${b}` : `${b}:${a}`;
  for (let at = 0; at < indices.length; at += 3) {
    const triangle = indices.slice(at, at + 3);
    if (
      triangle.length !== 3 ||
      new Set(triangle).size !== 3 ||
      triangle.some((v) => !Number.isSafeInteger(v) || v < 0 || v >= count)
    )
      throw new Error("Attachment disk has an invalid triangle.");
    for (let corner = 0; corner < 3; corner++) {
      const a = triangle[corner],
        b = triangle[(corner + 1) % 3];
      const c = triangle[(corner + 2) % 3];
      const left = links[a].get(b) ?? new Set<number>(),
        right = links[a].get(c) ?? new Set<number>();
      left.add(c);
      right.add(b);
      links[a].set(b, left);
      links[a].set(c, right);
      adjacency[a].add(b);
      adjacency[b].add(a);
      const id = key(a, b),
        previous = edges.get(id);
      if (previous === undefined) edges.set(id, [a, b]);
      else if (previous.length !== 2 || previous[0] !== b || previous[1] !== a)
        throw new Error(
          "Attachment disk is nonmanifold or inconsistently oriented.",
        );
      else previous.push(a, b);
    }
  }
  if (
    count - edges.size + indices.length / 3 !== 1 ||
    adjacency.some((row) => row.size === 0)
  )
    throw new Error(
      "Attachment patch does not have disk Euler characteristic.",
    );
  const boundary = new Map<number, number>();
  for (const edge of edges.values())
    if (edge.length === 2) {
      if (boundary.has(edge[0]))
        throw new Error("Attachment disk boundary branches.");
      boundary.set(edge[0], edge[1]);
    }
  const first = boundary.keys().next().value;
  if (first === undefined) throw new Error("Attachment disk has no boundary.");
  const loop: number[] = [first];
  let next = boundary.get(first);
  while (next !== first) {
    if (next === undefined || loop.includes(next))
      throw new Error("Attachment disk boundary is not one simple loop.");
    loop.push(next);
    next = boundary.get(next);
  }
  if (loop.length !== boundary.size || loop.length < 3)
    throw new Error("Attachment patch has multiple boundaries.");
  for (let vertex = 0; vertex < count; vertex++) {
    const link = links[vertex],
      entries = [...link.keys()];
    const ends = entries.filter((neighbor) => link.get(neighbor)!.size === 1);
    if (
      entries.some((neighbor) => link.get(neighbor)!.size > 2) ||
      ends.length !== (boundary.has(vertex) ? 2 : 0)
    )
      throw new Error(
        "Attachment disk vertex link is not a manifold path or cycle.",
      );
    const visited = new Set<number>([entries[0]]),
      row = [entries[0]];
    for (let at = 0; at < row.length; at++)
      for (const neighbor of link.get(row[at])!)
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          row.push(neighbor);
        }
    if (visited.size !== entries.length)
      throw new Error("Attachment disk has a disconnected vertex link.");
  }
  const reached = new Set<number>([first]),
    queue = [first];
  for (let at = 0; at < queue.length; at++)
    for (const neighbor of adjacency[queue[at]])
      if (!reached.has(neighbor)) {
        reached.add(neighbor);
        queue.push(neighbor);
      }
  if (reached.size !== count)
    throw new Error("Attachment disk is disconnected.");
  const coordinates = new Array<number>(2 * count).fill(0);
  loop.forEach((vertex, at) => {
    const angle = (2 * Math.PI * at) / loop.length;
    coordinates[2 * vertex] = Math.cos(angle);
    coordinates[2 * vertex + 1] = Math.sin(angle);
  });
  for (let at = 0; at < loop.length; at++) {
    const a = loop[at],
      b = loop[(at + 1) % loop.length],
      c = loop[(at + 2) % loop.length];
    const turn =
      (coordinates[2 * b] - coordinates[2 * a]) *
        (coordinates[2 * c + 1] - coordinates[2 * b + 1]) -
      (coordinates[2 * b + 1] - coordinates[2 * a + 1]) *
        (coordinates[2 * c] - coordinates[2 * b]);
    if (!(turn > 0))
      throw new Error(
        "Attachment circle boundary lost strict convexity at output precision.",
      );
  }
  const interior = Array.from({ length: count }, (_, i) => i).filter(
    (v) => !boundary.has(v),
  );
  const ordinal = new Map(interior.map((v, at) => [v, at]));
  const multiply = (input: readonly number[]): number[] =>
    interior.map((v, at) => {
      let value = adjacency[v].size * input[at];
      for (const neighbor of adjacency[v]) {
        const id = ordinal.get(neighbor);
        if (id !== undefined) value -= input[id];
      }
      return value;
    });
  const dot = (a: readonly number[], b: readonly number[]): number =>
    a.reduce((sum, value, at) => sum + value * b[at], 0);
  for (const axis of [0, 1]) {
    const rhs = interior.map((v) => {
      let value = 0;
      for (const neighbor of adjacency[v])
        if (boundary.has(neighbor)) value += coordinates[2 * neighbor + axis];
      return value;
    });
    const solution = rhs.map(() => 0);
    let residual = [...rhs],
      preconditioned = residual.map(
        (v, at) => v / adjacency[interior[at]].size,
      );
    let direction = [...preconditioned],
      energy = dot(residual, preconditioned);
    const threshold =
      (64 * Number.EPSILON) ** 2 * Math.max(dot(rhs, rhs), Number.MIN_VALUE);
    let converged = dot(residual, residual) <= threshold;
    for (
      let iteration = 0;
      !converged && iteration < 4 * interior.length;
      iteration++
    ) {
      const product = multiply(direction),
        denominator = dot(direction, product);
      if (!(denominator > 0) || !Number.isFinite(denominator))
        throw new Error(
          "Attachment Dirichlet matrix is not positive definite.",
        );
      const step = energy / denominator;
      for (let at = 0; at < solution.length; at++)
        solution[at] += step * direction[at];
      // Recompute the actual equation residual; a recursively small CG residual
      // alone does not establish that the emitted coordinates solve the system.
      const actual = multiply(solution);
      residual = rhs.map((v, at) => v - actual[at]);
      converged = dot(residual, residual) <= threshold;
      if (converged) break;
      preconditioned = residual.map(
        (v, at) => v / adjacency[interior[at]].size,
      );
      const nextEnergy = dot(residual, preconditioned),
        ratio = nextEnergy / energy;
      direction = preconditioned.map((v, at) => v + ratio * direction[at]);
      energy = nextEnergy;
    }
    if (!converged)
      throw new Error(
        "Attachment harmonic solve did not reach its floating-point residual bound.",
      );
    interior.forEach((v, at) => {
      coordinates[2 * v + axis] = solution[at];
    });
  }
  for (let at = 0; at < indices.length; at += 3) {
    const [a, b, c] = indices.slice(at, at + 3);
    const signedArea =
      (coordinates[2 * b] - coordinates[2 * a]) *
        (coordinates[2 * c + 1] - coordinates[2 * a + 1]) -
      (coordinates[2 * b + 1] - coordinates[2 * a + 1]) *
        (coordinates[2 * c] - coordinates[2 * a]);
    if (!(signedArea > 0) || !Number.isFinite(signedArea))
      throw new Error(
        `Attachment chart triangle ${at / 3} is degenerate or reversed.`,
      );
  }
  // A connected oriented manifold disk, one simple convex boundary and
  // strictly positive faces have degree one throughout that boundary. Thus
  // no two triangle interiors overlap; checking each emitted face closes the
  // floating-point injectivity premise rather than relying on solver status.
  return coordinates;
}
