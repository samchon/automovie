import { solveAutoMovieSubdivisionLimit } from "@automovie/engine";
import type { IAutoMovieSubdivisionStencil } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * A capped inverse solve reports the error of the controls it actually returns.
 *
 * Scenarios:
 *
 * 1. A finite stochastic stencil with eigenvalue 0.0005 exhausts 2,000 updates;
 *    its reported error equals the independently evaluated final linear
 *    system.
 * 2. An identity stencil converges immediately and all-held controls stay fixed.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public in-place solver and measures the final output, catching a residual measured before the last update while preserving converged and entirely held behavior.
 * @evidence contracts/development/testing.md#independent-expectations The symmetric two-row matrix has eigenvalues 1 and 0.0005; opposite targets follow a scalar geometric series. The residual oracle directly multiplies the authored matrix by returned controls, without replaying solver iterations. This deliberately slow algebraic stencil tests the kernel contract, not whether a particular quad cage generates it. Tolerances of 1e-10 for the residual and 1e-7 for accumulated controls bound floating arithmetic far below one missed update.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers finite nonconvergence at the cap, immediate convergence, all held vertices, three coordinate axes and unchanged borrowed targets. Mesh-derived fitting and malformed cage admission belong to existing subdivision tests.
 * @evidence contracts/development/testing.md#execution-ownership The discoverable entry calls portable engine arithmetic on owned typed arrays without a process, build, browser or renderer.
 * @evidence contracts/development/common.md#meaningful-documentation States the exhaustion premise, independent matrix oracle, neighboring stopping cases and numerical limitations.
 */
export function test_geometry_subdivision_final_residual(): void {
  const stencil: IAutoMovieSubdivisionStencil = {
    count: 2,
    offsets: new Int32Array([0, 2, 4]),
    indices: new Int32Array([0, 1, 0, 1]),
    weights: new Float64Array([0.50025, 0.49975, 0.49975, 0.50025]),
  };
  const targets: Float64Array = new Float64Array([1, 2, -3, -1, -2, 3]);
  const positions: Float64Array = new Float64Array(6);
  const residual: number = solveAutoMovieSubdivisionLimit({
    stencil,
    targets,
    free: new Uint8Array([1, 1]),
    positions,
    scratch: new Float64Array(6),
  });
  const errors: number[] = [];
  for (let vertex: number = 0; vertex < 2; ++vertex) {
    const components: number[] = [];
    for (let axis: number = 0; axis < 3; ++axis)
      components.push(
        targets[3 * vertex + axis]! -
          0.50025 * positions[3 * vertex + axis]! -
          0.49975 * positions[3 * (1 - vertex) + axis]!,
      );
    errors.push(Math.hypot(...components));
  }
  const measured: number = Math.max(...errors);
  const scale: number = (1 - Math.pow(1 - 0.0005, 2001)) / 0.0005;
  TestValidator.predicate(
    "the capped solution remains finite and unconverged",
    measured > 1e-4,
  );
  TestValidator.predicate(
    "residual describes returned controls",
    nclose(residual, measured, 1e-10),
  );
  TestValidator.predicate(
    "exactly 2,000 updates of the slow eigenmode",
    positions.every((value: number, index: number): boolean =>
      nclose(value, scale * targets[index]!, 1e-7),
    ),
  );
  TestValidator.predicate(
    "borrowed targets remain unchanged",
    targets.every((value: number, index: number): boolean =>
      nclose(value, [1, 2, -3, -1, -2, 3][index]!, 0),
    ),
  );

  for (const held of [false, true]) {
    const output: Float64Array = new Float64Array(6);
    const error: number = solveAutoMovieSubdivisionLimit({
      stencil: held
        ? stencil
        : {
            count: 2,
            offsets: new Int32Array([0, 1, 2]),
            indices: new Int32Array([0, 1]),
            weights: new Float64Array([1, 1]),
          },
      targets,
      free: new Uint8Array(held ? [0, 0] : [1, 1]),
      positions: output,
      scratch: new Float64Array(6),
    });
    TestValidator.predicate(
      `zero residual for ${held ? "held" : "identity"} controls`,
      nclose(error, 0, 0) &&
        output.every((value: number, index: number): boolean =>
          nclose(value, targets[index]!, 0),
        ),
    );
  }
}
