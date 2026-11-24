import type {
  AutoMovieBernsteinGrid64,
  AutoMovieBernsteinPolynomial64,
  AutoMovieVector3Tuple,
  IAutoMovieLocalHermiteField64,
  IAutoMovieLocalHermiteStream64,
  IAutoMoviePlanLocalHermite64,
  IAutoMoviePlanLocalHermite64Leaf,
  IAutoMoviePlanLocalHermite64Plan,
} from "@automovie/interface";

import { AutoMovieBernsteinSubdivision64 as S } from "./AutoMovieBernsteinSubdivision64";
import { AutoMovieCurveMath64 as V } from "./AutoMovieCurveMath64";
import { AutoMovieLocalHermiteField64 as F } from "./AutoMovieLocalHermiteField64";

/** Prepare bounded adaptive leaves for one immutable physical Hermite run. */
export function planAutoMovieLocalHermite64(
  input: IAutoMovieLocalHermiteStream64.Input,
): IAutoMoviePlanLocalHermite64.IResult {
  if (
    !input.name.trim() ||
    !input.topologyDomain.trim() ||
    !(input.toleranceMm > 0) ||
    input.maxCellsPerInterval < 1 ||
    input.maxVerticesPerChunk < 3 ||
    (input.vertexOffset ?? 0) < 0
  )
    throw new Error(
      "Named physical domain, positive finite tolerance and safe resource budgets required",
    );
  const field: IAutoMovieLocalHermiteField64.Prepared = F.prepare(
    input.stations,
    input.courses,
    input.stationInterpolation ?? "quadratic",
  );
  const norm: (p: AutoMovieVector3Tuple) => number = (
    p: AutoMovieVector3Tuple,
  ): number => Math.hypot(...p);
  const bounds: (grid: AutoMovieBernsteinGrid64) => [number, number, number] = (
    grid: AutoMovieBernsteinGrid64,
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
    return [uu / 8, uv / 4, vv / 8];
  };
  const plan: (interval: number) => IAutoMoviePlanLocalHermite64Plan = (
    interval: number,
  ): IAutoMoviePlanLocalHermite64Plan => {
    if (interval >= input.courses.length - 1) return { cells: [], leaves: [] };
    try {
      const cells: IAutoMovieLocalHermiteField64.Cell[] =
          field.interval(interval),
        leaves: IAutoMoviePlanLocalHermite64Leaf[] = [];
      const stack: IAutoMoviePlanLocalHermite64Leaf[] = cells
        .map(
          (
            cell: IAutoMovieLocalHermiteField64.Cell,
            k: number,
          ): IAutoMoviePlanLocalHermite64Leaf => ({
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
        const cell: IAutoMoviePlanLocalHermite64Leaf = stack.pop()!,
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
        const a: AutoMovieBernsteinGrid64 = [],
          z: AutoMovieBernsteinGrid64 = [];
        if (alongU)
          for (const row of cell.grid) {
            const pieces: [
              AutoMovieBernsteinPolynomial64,
              AutoMovieBernsteinPolynomial64,
            ] = S.split(row, 0.5);
            a.push(pieces[0]);
            z.push(pieces[1]);
          }
        else {
          const columns: [
            AutoMovieBernsteinPolynomial64,
            AutoMovieBernsteinPolynomial64,
          ][] = [0, 1, 2, 3].map(
            (
              c: number,
            ): [
              AutoMovieBernsteinPolynomial64,
              AutoMovieBernsteinPolynomial64,
            ] =>
              S.split(
                cell.grid.map(
                  (
                    row: AutoMovieBernsteinPolynomial64,
                  ): AutoMovieVector3Tuple => row[c]!,
                ),
                0.5,
              ),
          );
          for (let r: number = 0; r < 4; r++) {
            a.push(
              columns.map(
                (
                  p: [
                    AutoMovieBernsteinPolynomial64,
                    AutoMovieBernsteinPolynomial64,
                  ],
                ): AutoMovieVector3Tuple => p[0][r]!,
              ),
            );
            z.push(
              columns.map(
                (
                  p: [
                    AutoMovieBernsteinPolynomial64,
                    AutoMovieBernsteinPolynomial64,
                  ],
                ): AutoMovieVector3Tuple => p[1][r]!,
              ),
            );
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
