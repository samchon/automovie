import type { IAutoMovieMotionHumanQuadraticProgram } from "@automovie/interface";
import { HumanArmTrajectorySiteError } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * A site selects a feasible contact point before the solver can trade clearance
 * against its location. The exact constraints keep the Jacobian and give each
 * component the same lower and upper step.
 *
 * Scenarios:
 *
 * 1. Offsets (3, -4) mm have length 5 mm, so a disc of radius 2.5 mm moves both
 *    halfway towards zero.
 * 2. The same contact in a radius-6 disc stays pinned where it stands.
 * 3. A zero-radius site keeps all three Cartesian components at its centre.
 * 4. A radius-`2 sqrt(2)` disc holds a square whose corners have coordinates `±2`
 *    mm. Moving the hard contact inside that square can clear a collider.
 */
export function test_motions_posture_arm_site_equalities(): void {
  const error: Parameters<typeof HumanArmTrajectorySiteError.equalities>[0] = {
    offsets: [3, -4],
    index: [2, 7],
    offsetRows: [
      [2, 1],
      [-1, 3],
    ],
  };
  const outside: IAutoMovieMotionHumanQuadraticProgram.IRow[] =
    HumanArmTrajectorySiteError.equalities(error, 2.5, "site");
  TestValidator.equals("the hard coordinates of the projected point", outside, [
    { key: "site|0", index: [2, 7], coef: [2, 1], l: -1.5, u: -1.5 },
    { key: "site|1", index: [2, 7], coef: [-1, 3], l: 2, u: 2 },
  ]);
  TestValidator.equals(
    "a contact in the disc remains fixed",
    HumanArmTrajectorySiteError.equalities(error, 6, "site").map(
      (row: IAutoMovieMotionHumanQuadraticProgram.IRow): number[] => [
        row.l,
        row.u,
      ],
    ),
    [
      [0, 0],
      [0, 0],
    ],
  );
  TestValidator.equals(
    "a point site fixes three components",
    HumanArmTrajectorySiteError.equalities(
      {
        ...error,
        offsets: [3, -4, 2],
        offsetRows: [...error.offsetRows, [0, 2]],
      },
      0,
      "site",
    ).map((row: IAutoMovieMotionHumanQuadraticProgram.IRow): number[] => [
      row.l,
      row.u,
    ]),
    [
      [-3, -3],
      [4, 4],
      [-2, -2],
    ],
  );
  TestValidator.equals(
    "a freely selected contact stays inside the authored region",
    HumanArmTrajectorySiteError.region(error, 2 * Math.SQRT2, "site", 8),
    [
      { key: "site|0", index: [2, 7, 8], coef: [2, 1, -2], l: -1, u: -1 },
      { key: "site|0|box", index: [8], coef: [1], l: -2, u: 0 },
      { key: "site|1", index: [2, 7, 9], coef: [-1, 3, -2], l: 2, u: 2 },
      { key: "site|1|box", index: [9], coef: [1], l: 0, u: 2 },
    ],
  );
}
