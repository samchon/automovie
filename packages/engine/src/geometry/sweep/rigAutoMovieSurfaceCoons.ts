/**
 * Compile a Coons patch's interior for per-pose evaluation, returning the
 * writer that fills it from its boundary.
 *
 * The interior point at `(s, t) = (i / columns, j / rows)` is the bilinearly
 * blended Coons patch of its four sides (Coons 1967, MIT Project MAC TR-41):
 * the two ruled blends `(1 - t) B(s) + t T(s)` and `(1 - s) L(t) + s R(t)`
 * less the bilinear blend of the four corners, eight boundary points with
 * weights fixed by `(s, t)`.
 *
 * @param grid Vertex indices by row `j` from 0 to `rows` and column `i` from 0 to `columns`, boundary and interior; only read.
 * @returns The writer, which reads the boundary vertices and writes the interior into the same buffer.
 *
 * @evidence contracts/common.md#principled-implementation Coons' bilinearly blended interpolation of four boundary curves, which reproduces every side exactly.
 * @evidence contracts/common.md#clear-and-simple-design The weights depend only on the grid, so they are stored once with their indices and the writer is a weighted sum.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No smoothing or relaxation is added to the interior.
 * @evidence contracts/common.md#meaningful-documentation States the formula, its source and the grid layout.
 * @evidence contracts/performance.md#efficient-algorithms Eight terms per interior point per pose, with no allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work Indices and weights are computed once.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains 17 numbers per interior point.
 */
export const rigAutoMovieSurfaceCoons: (grid: number[][]) => (targets: Float64Array) => void = (
  grid: number[][],
): ((targets: Float64Array) => void) => {
  const rows: number = grid.length - 1;
  const columns: number = grid[0]!.length - 1;
  const terms: number[] = [];
  for (let j: number = 1; j < rows; ++j)
    for (let i: number = 1; i < columns; ++i) {
      const s: number = i / columns;
      const t: number = j / rows;
      terms.push(grid[j]![i]!, grid[0]![i]!, 1 - t, grid[rows]![i]!, t, grid[j]![0]!, 1 - s, grid[j]![columns]!, s);
      terms.push(grid[0]![0]!, -(1 - s) * (1 - t), grid[0]![columns]!, -s * (1 - t), grid[rows]![0]!, -(1 - s) * t, grid[rows]![columns]!, -s * t);
    }
  const coons: Float64Array = Float64Array.from(terms);
  return (targets: Float64Array): void => {
    for (let k: number = 0; k < coons.length; k += 17) {
      const o: number = 3 * coons[k]!;
      for (let c: number = 0; c < 3; ++c) {
        let sum: number = 0;
        for (let w: number = k + 1; w < k + 17; w += 2) sum += targets[3 * coons[w]! + c]! * coons[w + 1]!;
        targets[o + c] = sum;
      }
    }
  };
};
