import { HumanPathParameterization } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/** Rounding of the stage programs' two-variable vertices, (m/s)² and m/s². */
const ROUNDING: number = 1e-9;

/** The straight path's length, metres. */
const LENGTH: number = 2;

/** Its gridpoint spacing, metres: a power of two, so every gridpoint is exact. */
const SPACING: number = 1 / 16;

/** The circle's radius, metres. */
const RADIUS: number = 0.5;

/**
 * `HumanPathParameterization` is TOPP-RA (Pham and Pham 2018, IEEE T-RO
 * 34(3):645, ported from toppra): the controllable sets of the squared path
 * velocity x = ṡ² backward from the end, then the greedy forward pass, and the
 * constant-acceleration time map (`ConstAccel`).
 *
 * The closed form: on a straight path q(s) = s of 2 m from rest to rest, under
 *
 * |q̇| ≤ 1 m/s and |q̈| ≤ 1 m/s², q̈ is the path acceleration u itself and
 *
 * X(s + Δ) = x(s) + 2 Δ u, so the backward sets are x ≤ min(1, 2 (2 − s)) and
 * the greedy forward pass rides their meet with the forward ramp, x = min(1, 2
 * s, 2 (2 − s)). That is the bang-coast-bang profile, the time-optimal one, its
 * duration L / v + v / a = 3 s; its kinks at 0.5 and 1.5 m are gridpoints,
 * where the constant-acceleration time map is exact.
 *
 * Scenarios:
 *
 * 1. The straight path: the status is ok, each controllable set is [0, min(1, 2 (2
 *    − s))], and each x is min(1, 2 s, 2 (2 − s)).
 * 2. Its time map lasts 3 s, and each interval's path acceleration is ±1 or 0.
 * 3. A 1 m arc of a 0.5 m circle under the same boxes: every gridpoint's velocity
 *    and the acceleration at both ends of each interval, q' u + q'' x with u
 *    constant over it (the interpolation discretisation), are within their
 *    boxes, and each x lies in its controllable set.
 * 4. `timed` on gridpoints 0, 1, 2 with x 0, 1, 1: instants 0, 2, 3 and path
 *    accelerations 0.5, 0.
 * 5. An end velocity no path under the boxes reaches is reported by the backward
 *    pass (`controllable`).
 * 6. A velocity box excluding zero on a quantity that does not move is refused,
 *    and so are gridpoints that do not ascend.
 * 7. Half a metre per second at entry gives squared velocity 0.25, and the
 *    first forward ramp adds 2 Δ.
 */
export function test_unit_motions_posture_path_parameterization(): void {
  // 1. The straight path.
  const grid: number[] = Array.from(
    { length: LENGTH / SPACING + 1 },
    (_: unknown, i: number): number => i * SPACING,
  );
  const line: HumanPathParameterization.IProblem = {
    path: {
      gridpoints: grid,
      first: grid.map((): number[] => [1]),
      second: grid.map((): number[] => [0]),
    },
    velocities: [
      {
        first: grid.map((): number[] => [1]),
        lower: grid.map((): number[] => [-1]),
        upper: grid.map((): number[] => [1]),
      },
    ],
    accelerations: [{ lower: [-1], upper: [1] }],
    start: 0,
    end: 0,
  };
  const straight: HumanPathParameterization.IResult =
    HumanPathParameterization.parametrize(line);
  TestValidator.equals("the straight path is solved", straight.status, "ok");
  TestValidator.predicate(
    "the controllable sets and the bang-coast-bang profile",
    grid.every(
      (s: number, i: number): boolean =>
        nclose(straight.controllable[i]![0], 0, ROUNDING) &&
        nclose(
          straight.controllable[i]![1],
          Math.min(1, 2 * (LENGTH - s)),
          ROUNDING,
        ) &&
        nclose(
          straight.parametrization[i]!,
          Math.min(1, 2 * s, 2 * (LENGTH - s)),
          ROUNDING,
        ),
    ),
  );

  // 2. Its time map.
  const timed: HumanPathParameterization.ITimed =
    HumanPathParameterization.timed(grid, straight.parametrization);
  TestValidator.predicate(
    "the time-optimal duration and the bang-coast-bang accelerations",
    nclose(timed.times.at(-1)!, 3, ROUNDING) &&
      timed.accelerations.every(
        (u: number): boolean =>
          nclose(u, 1, ROUNDING) ||
          nclose(u, 0, ROUNDING) ||
          nclose(u, -1, ROUNDING),
      ),
  );

  // 3. A circle.
  const arc: number[] = Array.from(
    { length: 41 },
    (_: unknown, i: number): number => i / 40,
  );
  const first = (s: number): number[] => [
    -Math.sin(s / RADIUS),
    Math.cos(s / RADIUS),
  ];
  const second = (s: number): number[] => [
    -Math.cos(s / RADIUS) / RADIUS,
    -Math.sin(s / RADIUS) / RADIUS,
  ];
  const circle: HumanPathParameterization.IResult =
    HumanPathParameterization.parametrize({
      path: { gridpoints: arc, first: arc.map(first), second: arc.map(second) },
      velocities: [
        {
          first: arc.map(first),
          lower: arc.map((): number[] => [-1, -1]),
          upper: arc.map((): number[] => [1, 1]),
        },
      ],
      accelerations: [{ lower: [-1, -1], upper: [1, 1] }],
      start: 0,
      end: 0,
    });
  const x: number[] = circle.parametrization;
  const accelerated = (at: number, u: number): boolean =>
    [0, 1].every(
      (k: number): boolean =>
        Math.abs(first(arc[at]!)[k]! * u + second(arc[at]!)[k]! * x[at]!) <=
        1 + ROUNDING,
    );
  const interval = (i: number): boolean => {
    const u: number = (x[i + 1]! - x[i]!) / (2 * (arc[i + 1]! - arc[i]!));
    return accelerated(i, u) && accelerated(i + 1, u);
  };
  TestValidator.equals("the circle is solved", circle.status, "ok");
  TestValidator.predicate(
    "every gridpoint within its boxes and its controllable set",
    arc.every(
      (s: number, i: number): boolean =>
        first(s).every(
          (v: number): boolean =>
            Math.abs(v) * Math.sqrt(x[i]!) <= 1 + ROUNDING,
        ) &&
        x[i]! >= circle.controllable[i]![0] - ROUNDING &&
        x[i]! <= circle.controllable[i]![1] + ROUNDING &&
        (i + 1 === arc.length || interval(i)),
    ) &&
      x[0] === 0 &&
      nclose(x.at(-1)!, 0, ROUNDING),
  );

  // 4. The time map's closed form.
  TestValidator.equals(
    "the constant-acceleration time map",
    HumanPathParameterization.timed([0, 1, 2], [0, 1, 1]),
    { times: [0, 2, 3], velocities: [0, 1, 1], accelerations: [0.5, 0] },
  );

  // 5. An unreachable end.
  TestValidator.equals(
    "an unreachable end velocity",
    HumanPathParameterization.parametrize({ ...line, end: 10 }).status,
    "controllable",
  );

  // 6. Refusals.
  const still: HumanPathParameterization.IProblem = {
    path: { gridpoints: [0, 1], first: [[1], [1]], second: [[0], [0]] },
    velocities: [
      {
        first: [[0], [0]],
        lower: [[0.5], [0.5]],
        upper: [[1], [1]],
      },
    ],
    accelerations: [],
    start: 0,
    end: 0,
  };
  TestValidator.predicate(
    "an infeasible box and descending gridpoints are refused",
    throwsError(
      (): HumanPathParameterization.IResult =>
        HumanPathParameterization.parametrize(still),
      "BoxConstraint is infeasible",
    ) &&
      throwsError(
        (): HumanPathParameterization.IResult =>
          HumanPathParameterization.parametrize({
            ...still,
            path: { ...still.path, gridpoints: [1, 1] },
            velocities: [],
          }),
        "Invalid times.",
      ),
  );

  // 7. The first state stores squared path velocity.
  const moving: HumanPathParameterization.IResult =
    HumanPathParameterization.parametrize({ ...line, start: 0.5 });
  TestValidator.predicate(
    "nonzero entry speed seeds the squared state",
    moving.status === "ok" &&
      nclose(moving.parametrization[0]!, 0.25, ROUNDING) &&
      nclose(moving.parametrization[1]!, 0.25 + 2 * SPACING, ROUNDING),
  );
}
