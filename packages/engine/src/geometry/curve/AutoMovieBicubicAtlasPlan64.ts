import type {
  AutoMovieBernsteinGrid64,
  AutoMovieBernsteinPolynomial64,
  AutoMovieVector3Tuple,
  IAutoMovieBicubicAtlas64,
  IAutoMovieBicubicAtlasPlan64,
  IAutoMovieBicubicAtlasTessellation64,
  IAutoMoviePrepareBicubicAtlasBoundary64,
} from "@automovie/interface";

import { AutoMovieBernsteinSubdivision64 as S } from "./AutoMovieBernsteinSubdivision64";
import { AutoMovieCanonicalBoundary64 as Q } from "./AutoMovieCanonicalBoundary64";
import { AutoMovieCurveMath64 as V } from "./AutoMovieCurveMath64";
import { prepareAutoMovieBicubicAtlasBoundary64 } from "./prepareAutoMovieBicubicAtlasBoundary64";
import { overflowsBinary64 } from "../../math/overflowsBinary64";

type Patch = IAutoMovieBicubicAtlas64.Patch;

type Cell = IAutoMovieBicubicAtlas64.Cell;
type Binding = IAutoMovieBicubicAtlas64.Binding;

/**
 * Admit canonical atlas coefficients and plan adaptive leaves under the
 * original shared cell budget.
 */
export function AutoMovieBicubicAtlasPlan64(
  input: IAutoMovieBicubicAtlasTessellation64.Input,
  SIDES: readonly (readonly number[])[],
  CORNERS: readonly (readonly [number, number, number])[],
): IAutoMovieBicubicAtlasPlan64.IResult {
  if (
    !input.topologyDomain.trim() ||
    !(input.toleranceMm > 0) ||
    input.maxCells < 1 ||
    input.maxVerticesPerChunk < 3 ||
    (input.vertexOffset ?? 0) < 0 ||
    (input.cellBudgetPolicy !== undefined &&
      input.cellBudgetPolicy !== "retain-coarse" &&
      input.cellBudgetPolicy !== "omit-unresolved")
  )
    throw new Error(
      "A physical domain, positive finite tolerance and safe atlas budgets are required",
    );
  for (let i: number = 0; i < input.controlsMm.length; i++) {
    const p: Readonly<AutoMovieVector3Tuple> = input.controlsMm[i]!;
    if (!p) throw new Error("Complete millimetre controls required");
  }
  const names: Set<string> = new Set();
  for (const patch of input.patches) {
    if (
      !patch ||
      !patch.id.trim() ||
      names.has(patch.id) ||
      patch.controlIds.length !== 16
    )
      throw new Error(
        "Unique named bicubic patches with sixteen control IDs required",
      );
    names.add(patch.id);
    for (let i: number = 0; i < 16; i++) {
      const id: number = patch.controlIds[i]!;
      if (id < 0 || id >= input.controlsMm.length)
        throw new Error("A patch control ID is outside the declared registry");
    }
  }
  const norm: (p: AutoMovieVector3Tuple) => number = (
    p: AutoMovieVector3Tuple,
  ): number => Math.hypot(...p);
  const boundary: IAutoMoviePrepareBicubicAtlasBoundary64.IResult =
    prepareAutoMovieBicubicAtlasBoundary64(input, SIDES);
  const {
    authorities,
    bindings,
    root,
    canonicalPoint,
    positions: canonicalPositions,
    conflicts,
  }: typeof boundary = boundary;
  const fanVertices: Map<
    string,
    Map<string, IAutoMovieBicubicAtlas64.Vertex>
  > = new Map();
  const cross: (
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ) => AutoMovieVector3Tuple = (
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
  ): AutoMovieVector3Tuple => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const bound: (grid: AutoMovieBernsteinGrid64) => [number, number, number] = (
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
    // Second differences of finite controls can overflow binary64.
    if ([uu, uv, vv].some(overflowsBinary64))
      throw new Error("nonfinite tensor derivative estimate");
    return [uu / 8, uv / 4, vv / 8];
  };
  let allocated: number = Math.min(input.maxCells, input.patches.length);
  const plans: IAutoMovieBicubicAtlas64.Plan[] = input.patches.map(
    (patch: Patch, p: number): IAutoMovieBicubicAtlas64.Plan => {
      const grid: AutoMovieBernsteinGrid64 = Array.from(
        { length: 4 },
        (_: unknown, r: number): AutoMovieBernsteinPolynomial64 =>
          Array.from(
            { length: 4 },
            (_unused: unknown, c: number): AutoMovieVector3Tuple => {
              const id: number = patch.controlIds[r * 4 + c]!,
                constructed: AutoMovieVector3Tuple | undefined =
                  canonicalPositions.get(root(`control:${id}`));
              return constructed === undefined
                ? V.clone(input.controlsMm[id]!)
                : V.clone(constructed);
            },
          ),
      );
      if (
        patch.controlIds.some((id: number): boolean =>
          conflicts.has(root(`control:${id}`)),
        )
      )
        return {
          grid,
          cells: [],
          diagnostics: [
            "canonical-coefficient-conflict: declared endpoint or handle authorities disagree or are nonfinite",
          ],
        };
      for (let side: number = 0; side < 4; side++) {
        const binding: Binding | undefined = bindings.get(
          `${patch.id}:${side}`,
        );
        if (!binding) continue;
        const net: AutoMovieBernsteinPolynomial64 = S.restrict(
          authorities
            .get(binding.authority)!
            .map(
              (id: number): AutoMovieVector3Tuple =>
                V.clone(input.controlsMm[id]!),
            ),
          Math.min(binding.start, binding.end),
          Math.max(binding.start, binding.end),
        );
        if (binding.start > binding.end) net.reverse();
        net[0] = canonicalPoint(
          binding.authority,
          Q.phase(binding.start, binding.end, 0),
        );
        net[3] = canonicalPoint(
          binding.authority,
          Q.phase(binding.start, binding.end, 1),
        );
        for (let k: number = 0; k < 4; k++) {
          const slot: number = SIDES[side]![k]!;
          grid[Math.floor(slot / 4)]![slot % 4] = net[k]!;
        }
      }
      for (const [slot, u, v] of CORNERS) {
        const point: AutoMovieVector3Tuple | undefined = canonicalPositions.get(
          root(`control:${patch.controlIds[slot]}`),
        );
        if (point) grid[v * 3]![u * 3] = point;
      }
      const cells: Cell[] = [],
        diagnostics: string[] = [];
      if (p >= input.maxCells)
        return {
          grid,
          cells,
          diagnostics: ["resource-unprocessed: no atlas root cell slot"],
        };
      const stack: Cell[] = [{ u0: 0, u1: 1, v0: 0, v1: 1, grid, error: 0 }];
      while (stack.length) {
        const cell: Cell = stack.pop()!;
        try {
          const b: [number, number, number] = bound(cell.grid);
          cell.error = b[0] + b[1] + b[2];
          if (cell.error <= input.toleranceMm) {
            cells.push(cell);
            continue;
          }
          if (allocated >= input.maxCells) {
            if (input.cellBudgetPolicy === "retain-coarse") {
              cells.push(cell);
              diagnostics.push(
                `approximation-unqualified: retained finite cell [${cell.u0},${cell.u1}]x[${cell.v0},${cell.v1}], error estimate ${cell.error} mm exceeds ${input.toleranceMm} mm`,
              );
            } else
              diagnostics.push(
                `resource-unprocessed: cell [${cell.u0},${cell.u1}]x[${cell.v0},${cell.v1}]`,
              );
            continue;
          }
          const alongU: boolean = b[0] >= b[2],
            middle: number = alongU
              ? (cell.u0 + cell.u1) / 2
              : (cell.v0 + cell.v1) / 2;
          if (
            alongU
              ? !(middle > cell.u0 && middle < cell.u1)
              : !(middle > cell.v0 && middle < cell.v1)
          )
            throw new Error("unrepresentable subdivision chart");
          const a: AutoMovieBernsteinGrid64 = [],
            z: AutoMovieBernsteinGrid64 = [];
          if (alongU)
            for (const row of cell.grid) {
              const parts: [
                AutoMovieBernsteinPolynomial64,
                AutoMovieBernsteinPolynomial64,
              ] = S.split(row, 0.5);
              a.push(parts[0]);
              z.push(parts[1]);
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
                    x: [
                      AutoMovieBernsteinPolynomial64,
                      AutoMovieBernsteinPolynomial64,
                    ],
                  ): AutoMovieVector3Tuple => x[0][r]!,
                ),
              );
              z.push(
                columns.map(
                  (
                    x: [
                      AutoMovieBernsteinPolynomial64,
                      AutoMovieBernsteinPolynomial64,
                    ],
                  ): AutoMovieVector3Tuple => x[1][r]!,
                ),
              );
            }
          }
          allocated++;
          stack.push(
            { ...cell, grid: z, ...(alongU ? { u0: middle } : { v0: middle }) },
            { ...cell, grid: a, ...(alongU ? { u1: middle } : { v1: middle }) },
          );
        } catch (error) {
          diagnostics.push(
            `arithmetic-unprocessed: cell [${cell.u0},${cell.u1}]x[${cell.v0},${cell.v1}]: ${error instanceof Error ? error.message : "unresolved"}`,
          );
        }
      }
      return { grid, cells, diagnostics };
    },
  );

  return { boundary, fanVertices, norm, cross, plans };
}
