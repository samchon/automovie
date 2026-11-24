import { AutoMovieSolidRailSolve } from "@automovie/engine";
import type { IAutoMovieSolidSurface } from "@automovie/interface";

/**
 * A rail's first-order chart guess may overshoot an owned positive root.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual chord solver with an explicit bounded chart reader.
 * @evidence contracts/development/testing.md#independent-expectations The authored line X(s) = s + 9s² has unit initial speed and reaches X=2 at (sqrt(73)-1)/18, inside [0, 0.5]. X=3 is outside its image.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes a valid root whose initial linear guess is outside and an absent root with the same reader.
 * @evidence contracts/development/testing.md#execution-ownership One closed-form source in the synchronous CPU test.
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the chart and exact chord roots.
 */
export function test_construction_operator_rail_offset(): void {
  /** Physical derivatives of the positively increasing bounded line. */
  const along = (s: number): IAutoMovieSolidSurface.IJet | null =>
    s < 0 || s > 0.5
      ? null
      : {
          p: [s + 9 * s * s, 0, 0],
          u: [1 + 18 * s, 0, 0],
          v: [0, 1, 0],
          uu: [18, 0, 0],
          uv: [0, 0, 0],
          vv: [0, 0, 0],
        };
  const read = (width: number): number | null =>
    AutoMovieSolidRailSolve.offset(along, [1, 0], [0, 0, 0], width, 40, 1e-12);
  const root: number | null = read(2);
  const expected: number = (Math.sqrt(73) - 1) / 18;
  if (root === null || Math.abs(root - expected) >= 1e-11)
    throw new Error(`The owned rail root is ${expected}, received ${root}`);
  if (read(3) !== null)
    throw new Error("The rail solver admitted a root outside its chart");
}
