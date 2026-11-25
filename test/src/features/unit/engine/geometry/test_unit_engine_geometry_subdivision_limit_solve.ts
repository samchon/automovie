import { solveAutoMovieSubdivisionLimit } from "@automovie/engine";
import type { IAutoMovieSubdivisionStencil } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `solveAutoMovieSubdivisionLimit` inverts a limit stencil for the controls
 * whose limit points meet the targets, capped at 2 000 updates, and reports
 * the error of the controls it actually returns.
 *
 * Fixture: two vertices whose limit is the symmetric average with weights
 * 0.50025 and 0.49975, targets (1, 2, -3) and (-1, -2, 3). The targets lie on
 * the slow eigenvector (eigenvalue 0.0005), so after the 2 001 Richardson
 * terms the controls are (1 - (1 - 0.0005)^2001) / 0.0005 times the targets.
 *
 * Scenarios:
 *
 * 1. The cap leaves the solve unconverged (error above 1e-4); the reported error
 *    equals the worst residual of the returned controls within 1e-10; each
 *    control is the closed form within 1e-7; the targets stay unchanged.
 * 2. The identity stencil, and the same stencil with both controls held, return
 *    the targets exactly with zero error.
 */
export function test_unit_engine_geometry_subdivision_limit_solve(): void {
  const stencil: IAutoMovieSubdivisionStencil = {
    count: 2,
    offsets: new Int32Array([0, 2, 4]),
    indices: new Int32Array([0, 1, 0, 1]),
    weights: new Float64Array([0.50025, 0.49975, 0.49975, 0.50025]),
  };
  const authored: number[] = [1, 2, -3, -1, -2, 3];
  const targets: Float64Array = Float64Array.from(authored);
  const solve = (s: IAutoMovieSubdivisionStencil, free: number[], out: Float64Array): number =>
    solveAutoMovieSubdivisionLimit({
      stencil: s,
      targets,
      free: Uint8Array.from(free),
      positions: out,
      scratch: new Float64Array(6),
    });

  // 1.
  const positions: Float64Array = new Float64Array(6);
  const reported: number = solve(stencil, [1, 1], positions);
  const measured: number = Math.max(
    ...[0, 1].map((v: number): number =>
      Math.hypot(
        ...[0, 1, 2].map(
          (a: number): number =>
            targets[3 * v + a]! -
            0.50025 * positions[3 * v + a]! -
            0.49975 * positions[3 * (1 - v) + a]!,
        ),
      ),
    ),
  );
  const factor: number = (1 - Math.pow(1 - 0.0005, 2001)) / 0.0005;
  TestValidator.predicate("unconverged", measured > 1e-4);
  TestValidator.predicate("reported error", Math.abs(reported - measured) <= 1e-10);
  TestValidator.predicate(
    "closed form",
    positions.every((p: number, i: number): boolean => Math.abs(p - factor * authored[i]!) <= 1e-7),
  );
  TestValidator.equals("targets kept", [...targets], authored);

  // 2.
  const identity: IAutoMovieSubdivisionStencil = {
    count: 2,
    offsets: new Int32Array([0, 1, 2]),
    indices: new Int32Array([0, 1]),
    weights: new Float64Array([1, 1]),
  };
  for (const [label, s, free] of [
    ["identity", identity, [1, 1]],
    ["held", stencil, [0, 0]],
  ] satisfies [string, IAutoMovieSubdivisionStencil, number[]][]) {
    const out: Float64Array = new Float64Array(6);
    TestValidator.equals(`${label} error`, solve(s, free, out), 0);
    TestValidator.equals(`${label} controls`, [...out], authored);
  }
}
