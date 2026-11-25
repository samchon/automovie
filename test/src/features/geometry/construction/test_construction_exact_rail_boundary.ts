import { prepareAutoMovieSolidExactRailBoundary } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * A paired chart rail classifies regular and tangent boundary points in both
 * charts and supplies their common phase to the neighbouring face.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the production prepared chart predicate and foot on the same closed cubic in two coordinate systems.
 * @evidence contracts/development/testing.md#independent-expectations The horizontal span has four collinear controls. Uniform cubic knot weights 1/6, 4/6 and 1/6 give the regular knot and tangent maximum directly.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks both open sides and the boundary at the flat span, regular knot and local maximum. The second chart also reads a periodic alias outside its lifted branch.
 * @evidence contracts/development/testing.md#execution-ownership Uses only explicit planar cubic controls and their analytic witness points.
 * @evidence contracts/development/common.md#meaningful-documentation States the coordinate transform, cubic witnesses and expected one-turn clock.
 */
export function test_construction_exact_rail_boundary(): void {
  type Pair = [number, number];
  const controls: Pair[] = [
    [-3, -2],
    [-1, -2],
    [1, -2],
    [3, -2],
    [3, 1],
    [2, 3],
    [0, 4],
    [-2, 3],
    [-3, 1],
  ];
  const period = 2 * Math.PI;
  const step = period / controls.length;
  const chart = (point: Pair): Pair => [
    4300 + 2 * point[0],
    5.9 + 0.075 * point[1],
  ];
  const moved = controls.map(chart);
  const prepare = (points: Pair[], turn?: number) =>
    prepareAutoMovieSolidExactRailBoundary(
      [...points.map(([u]) => u), ...points.map(([, v]) => v)],
      points,
      turn,
    );
  const host = prepare(controls);
  const part = prepare(moved, period);
  if (host === null || part === null)
    throw new Error("An authored closed rail was refused");

  const witnesses: {
    name: string;
    point: Pair;
    inside: Pair;
    outside: Pair;
    clock: number;
    normal?: true;
  }[] = [
    {
      name: "horizontal span",
      point: [0, -2],
      inside: [0, -1.75],
      outside: [0, -2.25],
      clock: 1.5 * step,
      normal: true,
    },
    {
      name: "regular endpoint",
      point: [17 / 6, 5 / 6],
      inside: [17 / 6 - 0.25, 5 / 6],
      outside: [17 / 6 + 0.25, 5 / 6],
      clock: 4 * step,
    },
    {
      name: "local maximum",
      point: [0, 11 / 3],
      inside: [0, 11 / 3 - 0.25],
      outside: [0, 11 / 3 + 0.25],
      clock: 6 * step,
      normal: true,
    },
  ];
  const correct = (actual: number, expected: number): boolean =>
    Math.abs(Math.sin((actual - expected) / 2)) < 1e-8;
  const alias = (point: Pair): Pair => {
    const [u, v] = chart(point);
    return [u, v + period];
  };
  for (const { name, point, inside, outside, clock, normal } of witnesses) {
    TestValidator.equals(`${name} host side`, [0, -1, 1], [
      host.side(...point),
      host.side(...inside),
      host.side(...outside),
    ]);
    TestValidator.equals(`${name} part side`, [0, -1, 1], [
      part.side(...alias(point)),
      part.side(...alias(inside)),
      part.side(...alias(outside)),
    ]);
    TestValidator.predicate(
      `${name} shared clock`,
      correct(host.clock(...point), clock) &&
        correct(part.clock(...alias(point)), clock),
    );
    if (normal === true)
      TestValidator.predicate(
        `${name} nearest foot`,
        correct(host.clock(...outside), clock) &&
          correct(part.clock(...alias(outside)), clock),
      );
  }
}
