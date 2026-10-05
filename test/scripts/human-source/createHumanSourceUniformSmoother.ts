/**
 * Uniform-Laplacian smoothing sweeps over a triangle surface: each sweep
 * replaces a value by the mean of itself and the average of its edge
 * neighbours (f ← (f + mean of neighbours) / 2). The returned function runs a
 * number of sweeps on a scalar field and returns a new field.
 */
export function createHumanSourceUniformSmoother(indices: Int32Array, count: number): (field: Float64Array, sweeps: number) => Float64Array {
  const neighbours: Set<number>[] = Array.from({ length: count }, () => new Set());
  for (let t = 0; t < indices.length; t += 3)
    for (let k = 0; k < 3; k++) {
      const a = indices[t + k];
      const b = indices[t + ((k + 1) % 3)];
      neighbours[a].add(b);
      neighbours[b].add(a);
    }
  const lists = neighbours.map((s) => Int32Array.from([...s].sort((x, y) => x - y)));
  return (field, sweeps) => {
    let current = Float64Array.from(field);
    for (let s = 0; s < sweeps; s++) {
      const next = new Float64Array(count);
      for (let v = 0; v < count; v++) {
        const list = lists[v];
        let sum = 0;
        for (let i = 0; i < list.length; i++) sum += current[list[i]];
        next[v] = 0.5 * (current[v] + (list.length === 0 ? current[v] : sum / list.length));
      }
      current = next;
    }
    return current;
  };
}
