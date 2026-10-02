/**
 * Two square skin patches for the body contact solver's unit tests: a flat
 * patch `a` at `z = 0` and a patch `b` one centimetre below it, shifted a
 * fraction of a grid step, whose centre vertex is lifted one centimetre above,
 * so the tent of `b` pierces `a` around the centre. Both are `n x n` vertex
 * grids two centimetres wide, wound counter-clockwise seen from `+z`, in one
 * shared position buffer: the vertices of `a` come first.
 *
 * Positions are metres. The solvers under test take segments as corner lists
 * over that buffer, and `near` as the neighbour graph of both patches.
 */
export interface IBodyContactPatchFixture {
  positions: number[];
  a: number[];
  b: number[];
  /** Every triangle of both patches, for the neighbour graph. */
  indices: number[];
  vertices: number;
}

/** The grid triangles of an `n x n` vertex patch whose ids start at `first`. */
const gridTriangles = (n: number, first: number): number[] => {
  const out: number[] = [];
  for (let row = 0; row + 1 < n; ++row)
    for (let column = 0; column + 1 < n; ++column) {
      const v = first + row * n + column;
      out.push(v, v + 1, v + n, v + 1, v + n + 1, v + n);
    }
  return out;
};

/** Build the pierced pair; `lift` is the height of the centre vertex of `b`. */
export const createBodyContactPatchFixture = (
  n = 3,
  lift = 0.01,
): IBodyContactPatchFixture => {
  const half = 0.01;
  const step = (2 * half) / (n - 1);
  const positions: number[] = [];
  // the second patch is shifted off the first's grid by a fraction of a step,
  // so its tent crosses the flat patch through triangle interiors and never
  // along shared edges, where a strict crossing test reads a touch
  for (const [z, bump, shiftX, shiftY] of [
    [0, 0, 0, 0],
    [-0.01, lift + 0.01, 0.0013, 0.0007],
  ])
    for (let row = 0; row < n; ++row)
      for (let column = 0; column < n; ++column) {
        const centre = row === (n - 1) / 2 && column === (n - 1) / 2;
        positions.push(
          -half + column * step + shiftX,
          -half + row * step + shiftY,
          z + (centre ? bump : 0),
        );
      }
  const a = gridTriangles(n, 0);
  const b = gridTriangles(n, n * n);
  return { positions, a, b, indices: [...a, ...b], vertices: 2 * n * n };
};
