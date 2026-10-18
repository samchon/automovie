import { AutoMovieBernsteinAlgebra64 as B } from "./AutoMovieBernsteinAlgebra64";
import { AutoMovieBernsteinSubdivision64 as S } from "./AutoMovieBernsteinSubdivision64";
import { AutoMovieCurveMath64 as V } from "./AutoMovieCurveMath64";
import { AutoMovieLocalHermiteField64 as F } from "./AutoMovieLocalHermiteField64";
import type { tessellateAutoMovieLocalHermite64 as T } from "./tessellateAutoMovieLocalHermite64";

type Leaf = F.Cell & { t0: number; t1: number; error: number; patch: string };
type Plan = { cells: F.Cell[]; leaves: Leaf[]; reason?: string };
type StreamInput = T.Input;

/**
 * Prepare bounded adaptive leaves for one immutable physical Hermite run.
 *
 * @evidence contracts/common.md#principled-implementation The same physical field, Bernstein second-partial estimates and exact half subdivisions retain the original split order and local gap policy.
 * @evidence contracts/common.md#clear-and-simple-design Field admission and planning are separate from append-only mesh emission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing arithmetic, admission, coefficient authority and explicit failure meanings remain unchanged; no source geometry fallback is added.
 * @evidence contracts/common.md#meaningful-documentation States the owned stage and immutable inputs; output qualification remains with the caller.
 * @evidence contracts/performance.md#efficient-algorithms The existing per-interval leaf bound and degree-three subdivision costs are retained; no global phase grid is added.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call reuses its prepared data for the same original lifetime without a new cross-call cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned closure owns one prepared field; interval stacks expire after each query and retained plans remain caller-owned.
 */
export function planAutoMovieLocalHermite64(input: StreamInput): {
  field: F.Prepared;
  plan: (interval: number) => Plan;
} {
  if (
    !input.name.trim() ||
    !input.topologyDomain.trim() ||
    !(input.toleranceMm > 0) ||
    !Number.isFinite(input.toleranceMm) ||
    !Number.isSafeInteger(input.maxCellsPerInterval) ||
    input.maxCellsPerInterval < 1 ||
    !Number.isSafeInteger(input.maxVerticesPerChunk) ||
    input.maxVerticesPerChunk < 3 ||
    !Number.isSafeInteger(input.vertexOffset ?? 0) ||
    (input.vertexOffset ?? 0) < 0
  )
    throw new Error(
      "Named physical domain, positive finite tolerance and safe resource budgets required",
    );
  const field: F.Prepared = F.prepare(
    input.stations,
    input.courses,
    input.stationInterpolation ?? "quadratic",
  );
  const norm: (p: B.Vec) => number = (p: B.Vec): number => Math.hypot(...p);
  const bounds: (grid: B.Grid) => [number, number, number] = (
    grid: B.Grid,
  ): [number, number, number] => {
    let uu: number = 0,
      uv: number = 0,
      vv: number = 0;
    for (let r: number = 0; r < 4; r++)
      for (let c: number = 0; c < 2; c++)
        uu = Math.max(
          uu,
          6 *
            norm(
              V.add(
                V.sub(grid[r]![c + 2]!, V.scale(grid[r]![c + 1]!, 2)),
                grid[r]![c]!,
              ),
            ),
        );
    for (let r: number = 0; r < 2; r++)
      for (let c: number = 0; c < 4; c++)
        vv = Math.max(
          vv,
          6 *
            norm(
              V.add(
                V.sub(grid[r + 2]![c]!, V.scale(grid[r + 1]![c]!, 2)),
                grid[r]![c]!,
              ),
            ),
        );
    for (let r: number = 0; r < 3; r++)
      for (let c: number = 0; c < 3; c++)
        uv = Math.max(
          uv,
          9 *
            norm(
              V.sub(
                V.sub(grid[r + 1]![c + 1]!, grid[r + 1]![c]!),
                V.sub(grid[r]![c + 1]!, grid[r]![c]!),
              ),
            ),
        );
    if (![uu, uv, vv].every(Number.isFinite))
      throw new Error("nonfinite-arithmetic: tensor derivative bound");
    return [uu / 8, uv / 4, vv / 8];
  };
  const plan: (interval: number) => Plan = (interval: number): Plan => {
    if (interval >= input.courses.length - 1) return { cells: [], leaves: [] };
    try {
      const cells: F.Cell[] = field.interval(interval),
        leaves: Leaf[] = [];
      const stack: Leaf[] = cells
        .map(
          (cell: F.Cell, k: number): Leaf => ({
            ...cell,
            t0: 0,
            t1: 1,
            error: 0,
            patch: `${input.name}.interval.${interval}.cell.${k}`,
          }),
        )
        .reverse();
      while (stack.length) {
        if (stack.length + leaves.length > input.maxCellsPerInterval)
          return {
            cells: [],
            leaves: [],
            reason: "resource-unprocessed: maxCellsPerInterval",
          };
        const cell: Leaf = stack.pop()!,
          b: [number, number, number] = bounds(cell.grid);
        cell.error = b[0] + b[1] + b[2];
        if (cell.error <= input.toleranceMm) {
          leaves.push(cell);
          continue;
        }
        const alongU: boolean = b[0] >= b[2];
        const middle: number = alongU
          ? (cell.u0 + cell.u1) / 2
          : (cell.t0 + cell.t1) / 2;
        if (
          alongU
            ? !(middle > cell.u0 && middle < cell.u1)
            : !(middle > cell.t0 && middle < cell.t1)
        )
          throw new Error(
            "nonfinite-arithmetic: unresolvable subdivision chart",
          );
        const a: B.Grid = [],
          z: B.Grid = [];
        if (alongU)
          for (const row of cell.grid) {
            const pieces: [B.Poly, B.Poly] = S.split(row, 0.5);
            a.push(pieces[0]);
            z.push(pieces[1]);
          }
        else {
          const columns: [B.Poly, B.Poly][] = [0, 1, 2, 3].map(
            (c: number): [B.Poly, B.Poly] =>
              S.split(
                cell.grid.map((row: B.Poly): B.Vec => row[c]!),
                0.5,
              ),
          );
          for (let r: number = 0; r < 4; r++) {
            a.push(columns.map((p: [B.Poly, B.Poly]): B.Vec => p[0][r]!));
            z.push(columns.map((p: [B.Poly, B.Poly]): B.Vec => p[1][r]!));
          }
        }
        stack.push(
          { ...cell, grid: z, ...(alongU ? { u0: middle } : { t0: middle }) },
          { ...cell, grid: a, ...(alongU ? { u1: middle } : { t1: middle }) },
        );
      }
      return { cells, leaves };
    } catch (error) {
      return {
        cells: [],
        leaves: [],
        reason: `arithmetic-unprocessed: ${error instanceof Error ? error.message : "unresolved interval"}`,
      };
    }
  };
  return { field, plan };
}
