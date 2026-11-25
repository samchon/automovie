import { AutoMovieCurveMath64 as C } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieCurveMath64,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

/**
 * `AutoMovieCurveMath64` is binary64 vector and cubic Bernstein arithmetic.
 *
 * Throughout, the straight cubic L has controls (0,0,0), (1,0,0), (2,0,0),
 * (3,0,0), so that x(t) = 3t.
 *
 * Scenarios:
 *
 * 1. Vector arithmetic: `clone` copies, `add` of (1,2,3) and (4,5,6) is (5,7,9),
 *    `sub` is (3,3,3), `scale` by 2 is (2,4,6), and `mix` of (0,0,0) and
 *    (2,4,6) is (1,2,3) at 0.5 and (4,8,12) at 2 (not clamped).
 * 2. `hermite` from (0,0,0) to (3,0,0) with derivatives (3,0,0) at both ends over
 *    width 1 gives L. `toHermite` of L over width 1 gives the end points and
 *    derivative (3,0,0) at both ends, (1.5,0,0) over width 2; a zero width and
 *    a three-control net are refused.
 * 3. `cubic` of L at 0.5 is (1.5,0,0); `derivative` of L is (3,0,0) at width 1 and
 *    (1,0,0) at width 3.
 * 4. `split` of L at 0.5 gives controls x = 0, 0.5, 1, 1.5 and 1.5, 2, 2.5, 3, the
 *    same with the affine flag.
 * 5. `partition` of L by widths 1, 1, 2 gives pieces from x = 0 to 0.75, 0.75 to
 *    1.5 and 1.5 to 3; a width of 0 is refused.
 * 6. `angular` of four equal points over equal widths has zero handles; `spans`
 *    with zero handles over four points at x = 0, 1, 2, 3 gives [p, p, next,
 *    next], the last span wrapping to the first.
 */
export function test_engine_geometry_curve_math(): void {
  const p = (x: number, y: number, z: number): AutoMovieVector3Tuple => [
    x,
    y,
    z,
  ];
  const line: IAutoMovieCurveMath64.Span = [
    p(0, 0, 0),
    p(1, 0, 0),
    p(2, 0, 0),
    p(3, 0, 0),
  ];

  // 1.
  const original: AutoMovieVector3Tuple = p(1, 2, 3);
  TestValidator.equals("clone", C.clone(original), original);
  TestValidator.predicate("clone is fresh", C.clone(original) !== original);
  TestValidator.equals("add", C.add(p(1, 2, 3), p(4, 5, 6)), p(5, 7, 9));
  TestValidator.equals("sub", C.sub(p(4, 5, 6), p(1, 2, 3)), p(3, 3, 3));
  TestValidator.equals("scale", C.scale(p(1, 2, 3), 2), p(2, 4, 6));
  TestValidator.equals("mix", C.mix(p(0, 0, 0), p(2, 4, 6), 0.5), p(1, 2, 3));
  TestValidator.equals(
    "extrapolate",
    C.mix(p(0, 0, 0), p(2, 4, 6), 2),
    p(4, 8, 12),
  );

  // 2.
  TestValidator.equals(
    "hermite",
    C.hermite(p(0, 0, 0), p(3, 0, 0), p(3, 0, 0), p(3, 0, 0), 1),
    line,
  );
  const back = C.toHermite(line, 1);
  TestValidator.equals("start", back.start, p(0, 0, 0));
  TestValidator.equals("end", back.end, p(3, 0, 0));
  TestValidator.equals("start derivative", back.startDerivative, p(3, 0, 0));
  TestValidator.equals("end derivative", back.endDerivative, p(3, 0, 0));
  TestValidator.equals(
    "derivative over width 2",
    C.toHermite(line, 2).startDerivative,
    p(1.5, 0, 0),
  );
  TestValidator.predicate(
    "zero width",
    throwsError(() => C.toHermite(line, 0)),
  );
  TestValidator.predicate(
    "three controls",
    throwsError(() => C.toHermite(line.slice(0, 3), 1)),
  );

  // 3.
  TestValidator.equals("cubic", C.cubic(line, 0.5), p(1.5, 0, 0));
  TestValidator.equals("derivative", C.derivative(line, 0.5, 1), p(3, 0, 0));
  TestValidator.equals(
    "derivative width 3",
    C.derivative(line, 0.5, 3),
    p(1, 0, 0),
  );

  // 4.
  for (const affine of [false, true]) {
    const [left, right] = C.split(line, 0.5, affine);
    TestValidator.equals(
      `left ${affine}`,
      left.map((control) => control[0]),
      [0, 0.5, 1, 1.5],
    );
    TestValidator.equals(
      `right ${affine}`,
      right.map((control) => control[0]),
      [1.5, 2, 2.5, 3],
    );
  }

  // 5.
  const pieces = C.partition(line, [1, 1, 2]);
  TestValidator.equals("pieces", pieces.length, 3);
  const ends: [number, number][] = pieces.map((piece): [number, number] => [
    piece[0]![0],
    piece[3]![0],
  ]);
  const expected: [number, number][] = [
    [0, 0.75],
    [0.75, 1.5],
    [1.5, 3],
  ];
  ends.forEach((end, index): void => {
    TestValidator.predicate(
      `piece ${index} start`,
      nclose(end[0], expected[index]![0], 1e-12),
    );
    TestValidator.predicate(
      `piece ${index} end`,
      nclose(end[1], expected[index]![1], 1e-12),
    );
  });
  TestValidator.predicate(
    "zero width piece",
    throwsError(() => C.partition(line, [1, 0])),
  );

  // 6.
  const same: AutoMovieVector3Tuple[] = [
    p(1, 1, 1),
    p(1, 1, 1),
    p(1, 1, 1),
    p(1, 1, 1),
  ];
  TestValidator.equals(
    "equal points have zero handles",
    C.angular(same, [1, 1, 1, 1]),
    [p(0, 0, 0), p(0, 0, 0), p(0, 0, 0), p(0, 0, 0)],
  );
  const supports: AutoMovieVector3Tuple[] = [
    p(0, 0, 0),
    p(1, 0, 0),
    p(2, 0, 0),
    p(3, 0, 0),
  ];
  const zero: AutoMovieVector3Tuple[] = supports.map(
    (): AutoMovieVector3Tuple => p(0, 0, 0),
  );
  const loop = C.spans(supports, zero, [1, 1, 1, 1]);
  TestValidator.equals("first span", loop[0], [
    p(0, 0, 0),
    p(0, 0, 0),
    p(1, 0, 0),
    p(1, 0, 0),
  ]);
  TestValidator.equals("wrapped span", loop[3], [
    p(3, 0, 0),
    p(3, 0, 0),
    p(0, 0, 0),
    p(0, 0, 0),
  ]);
}
