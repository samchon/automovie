/** Vertices on a triangle surface's open boundary: corners of an edge that only one triangle uses. */
export function findHumanSourceBoundaryVertices(indices: Int32Array, count: number): Uint8Array {
  const uses = new Map<string, number>();
  for (let t = 0; t < indices.length; t += 3)
    for (let k = 0; k < 3; k++) {
      const a = indices[t + k];
      const b = indices[t + ((k + 1) % 3)];
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      uses.set(key, (uses.get(key) ?? 0) + 1);
    }
  const boundary = new Uint8Array(count);
  for (const [key, n] of uses)
    if (n === 1) for (const v of key.split(",")) boundary[Number(v)] = 1;
  return boundary;
}
