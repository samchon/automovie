import { orientAutoMovieSolidChart } from "@automovie/engine";

/** An independent finite chart point, without a surface/mesher dependency. */
type Point = [number, number];

/**
 * Native-chart topology must distinguish an exact contact from nearby points.
 *
 * Scenarios:
 * 1. For N=2^53-1, det((N,N-1),(N-1,N-2))=-1 by expansion, although the two rounded products cancel. Positive binary rescaling, cyclic permutation, reversal and reflection preserve their known signs.
 * 2. Ordinary axis/diagonal cases, identical points, a determinant smaller than binary64's minimum positive magnitude, and a determinant whose intermediate differences overflow retain their exact represented-number signs.
 * 3. Each caller coordinate is read once and each nonfinite coordinate is refused. No coordinate is moved to turn an uncertain sign into a contact.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the chart orientation primitive used to prepare shared boundary constraints and requires the literal sign before topology is inferred. It detects cancellation, underflow, overflow and a tolerance-based false collinearity.
 * @evidence contracts/development/testing.md#independent-expectations The near-collinear determinant is N(N-2)-(N-1)^2=-1; power-of-two scaling preserves the represented inputs exactly. The subnormal determinant is -MIN_VALUE^2 and the extreme diagonal determinant is 2*MAX_VALUE times the signed unit ordinate. Permutation/reflection identities give the other signs without querying the implementation.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers ordinary, zero, cancellation, subnormal and overflow paths, both signs, three binary units, coordinate ownership and every nonfinite coordinate position. It proves a predicate only, not complete arrangement, triangulation or final f1 acceptance.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous CPU unit through --include construction_chart_orientation; creates no Human, renderer, host, process or external fixture.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 3 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: For N=2^53-1, det((N,N-1),(N-1,N-2))=-1 by expansion, although the two rounded products cancel. Positive binary rescaling, cyclic...).
 */
export function test_construction_chart_orientation(): void {
  const failures: string[] = [];
  const N: number = 2 ** 53 - 1;
  for (const scale of [2 ** -300, 1, 2 ** 300]) {
    const a: Point = [0, 0];
    const b: Point = [N * scale, (N - 1) * scale];
    const c: Point = [(N - 1) * scale, (N - 2) * scale];
    check(failures, `cancellation ${scale}`, a, b, c, -1);
    check(failures, `cyclic ${scale}`, b, c, a, -1);
    check(failures, `reverse ${scale}`, a, c, b, 1);
    check(failures, `reflection ${scale}`, a, [b[1], b[0]], [c[1], c[0]], 1);
  }
  check(failures, "axis positive", [0, 0], [2, 0], [1, 1], 1);
  check(failures, "axis negative", [0, 0], [0, 2], [1, 1], -1);
  check(failures, "ordinary diagonal", [1, 1], [3, 4], [-2, 5], 1);
  check(failures, "collinear", [0, 0], [2, 2], [1, 1], 0);
  check(failures, "identical", [2, 3], [2, 3], [-1, 5], 0);
  check(
    failures,
    "subnormal",
    [0, 0],
    [Number.MIN_VALUE, Number.MIN_VALUE],
    [2 * Number.MIN_VALUE, Number.MIN_VALUE],
    -1,
  );
  check(
    failures,
    "overflow positive",
    [-Number.MAX_VALUE, -Number.MAX_VALUE],
    [Number.MAX_VALUE, Number.MAX_VALUE],
    [0, 1],
    1,
  );
  check(
    failures,
    "overflow negative",
    [-Number.MAX_VALUE, -Number.MAX_VALUE],
    [Number.MAX_VALUE, Number.MAX_VALUE],
    [0, -1],
    -1,
  );

  const reads: [number, number] = [0, 0];
  const own: Point = [0, 0];
  Object.defineProperties(own, {
    0: {
      get: (): number => {
        reads[0]++;
        return 0;
      },
    },
    1: {
      get: (): number => {
        reads[1]++;
        return 0;
      },
    },
  });
  check(
    failures,
    "single coordinate reads",
    own,
    [N, N - 1],
    [N - 1, N - 2],
    -1,
  );
  if (reads[0] !== 1 || reads[1] !== 1)
    failures.push(`coordinate reads ${reads}, expected 1,1`);

  for (const invalid of [NaN, Infinity, -Infinity])
    for (let at: number = 0; at < 6; at++) {
      const points: [Point, Point, Point] = [
        [0, 0],
        [1, 2],
        [3, 4],
      ];
      const target: Point = points[Math.floor(at / 2)]!;
      target[at % 2] = invalid;
      let refused: boolean = false;
      try {
        orientAutoMovieSolidChart(...points);
      } catch (error: unknown) {
        refused = error instanceof RangeError;
      }
      if (!refused)
        failures.push(`nonfinite coordinate ${invalid}/${at} was not refused`);
    }
  if (failures.length !== 0)
    throw new Error(`Chart orientation findings:\n${failures.join("\n")}`);
}

/** Require the literal finite sign; a NaN cannot pass a difference comparison. */
function check(
  failures: string[],
  label: string,
  a: Point,
  b: Point,
  c: Point,
  expected: number,
): void {
  const actual: number = orientAutoMovieSolidChart(a, b, c);
  if (actual !== expected)
    failures.push(`${label}: ${actual}, expected ${expected}`);
}
