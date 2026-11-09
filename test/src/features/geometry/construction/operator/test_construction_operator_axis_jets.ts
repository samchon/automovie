import {
  AutoMovieConstructionViews,
  type AutoMovieLoftFrame,
  AutoMovieViewAxis,
  AutoMovieViewParallelAxis,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** A frame jet returned by an actual analytic axis. */
type Jet = NonNullable<ReturnType<NonNullable<AutoMovieViewAxis.IAxis["jet"]>>>;

/** A scalar's value and first two station derivatives. */
type Dual = [number, number, number];

/** A world position or frame component triple. */
type Vec3 = [number, number, number];

/**
 * Actual axis derivatives follow the authored course and material roll, independently of loft resampling.
 *
 * Scenarios:
 * 1. A planar right-angle joint at three physical scales has the analytic Rodrigues tangent/normal plane, independent Simpson-integrated origins and independently differentiated scalar-coordinate expressions, including both turn boundaries and straight runs.
 * 2. The same moving frame carries a simultaneous material roll; second-order dual arithmetic differentiates its explicit trigonometric coordinates and catches omitted mixed/product terms. At and jet values agree, and modifying a returned derivative cannot change a later reading.
 * 3. Affine level/parallel origins have their exact constant derivatives. A nonzero root-origin endpoint keeps its finite value and absent singular station jet; its interior derivative is the square root's analytic derivative.
 * 4. A numerical minimal-rotation source does not claim an exact station-jet callback. A deliberately changed derivative fails the same independent reader.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads actual axis at/jet callbacks through direct builders and the real metre-to-mm ConstructionViews converter, checking all origin/u/v derivative components and output ownership.
 * @evidence contracts/development/testing.md#independent-expectations The declared planar turn and material roll give explicit scalar sine/cosine coordinate formulas differentiated by separate second-order dual arithmetic; origin displacement uses composite Simpson with 4096 panels rather than production Gauss quadrature. Component limits are 512 binary64 epsilons times the physical/derivative scale, with a separate 1e-9 times physical scale for the independent displacement quadrature. The latter is an observer accuracy allowance, not a new production or original axes-test tolerance.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers scales 0.001/1/1000, straight/turn/boundary stations, base and simultaneous rolled frames, affine and singular nonzero origins, absent numerical support, fresh outputs and a made derivative defect. Final loft/source transfer, continuation and capped coefficient charts are owned by their separate tests.
 * @evidence contracts/development/testing.md#execution-ownership Discoverable synchronous CPU operator test through --include construction_operator_axis_jets; it starts no Human generation, process, viewer or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A planar right-angle joint at three physical scales has the analytic Rodrigues tangent/normal plane, independent Simpson-integrated...).
 */
export function test_construction_operator_axis_jets(): void {
  const failures: string[] = [];
  for (const scale of [0.001, 1, 1000]) {
    const half: number = 20 * scale;
    const displacement: Vec3 = integral(1, half);
    const start: number = 100 * scale - displacement[0];
    for (const rolled of [false, true]) {
      const axis: AutoMovieViewAxis.IAxis | string =
        AutoMovieConstructionViews.frame({
          type: "jointed",
          centres: [
            { x: 0, y: 0, z: 0 },
            { x: scale / 10, y: 0, z: 0 },
            { x: scale / 10, y: scale / 10, z: 0 },
          ],
          halves: [half / 1000],
          up: { x: 0, y: 1, z: 0 },
          ...(rolled
            ? {
                roll: {
                  from: (start - 10 * scale) / 1000,
                  to: (start + 50 * scale) / 1000,
                  up: {
                    x: -Math.cos(Math.PI / 3),
                    y: 0,
                    z: -Math.sin(Math.PI / 3),
                  },
                },
              }
            : {}),
        });
      if (typeof axis === "string") {
        failures.push(axis);
        continue;
      }
      if (axis.jet === undefined) {
        failures.push("jointed source has no analytic callback");
        continue;
      }
      for (const share of [-0.25, 0, 0.125, 0.5, 0.875, 1, 1.25]) {
        const station: number = start + 2 * half * share;
        const actual: Jet | null = axis.jet(station);
        if (actual === null) {
          failures.push(
            `jointed ${scale}/${rolled}/${share}: missing finite interior jet`,
          );
          continue;
        }
        const expected: Jet = planar(station, start, half, scale, rolled);
        compare(
          actual,
          expected,
          scale,
          `${scale}/${rolled}/${share}`,
          failures,
        );
        const value: AutoMovieLoftFrame.IFrame = axis.at(station);
        for (const key of ["origin", "u", "v"] as const)
          if (
            value[key].some(
              (component: number, k: number): boolean =>
                !Object.is(component, actual.value[key][k]),
            )
          )
            failures.push(
              `at/jet value differs at ${scale}/${rolled}/${share}/${key}`,
            );
        actual.first.u.fill(123456);
        const repeated: Jet | null = axis.jet(station);
        if (repeated === null) failures.push("repeated source jet disappeared");
        else
          compare(
            repeated,
            expected,
            scale,
            "returned derivative ownership",
            failures,
          );
      }
    }
  }

  const level: AutoMovieViewAxis.IAxis = AutoMovieViewAxis.level(
    [
      { station: 0, value: 3 },
      { station: 10, value: 23 },
    ],
    [
      { station: 0, value: 5 },
      { station: 10, value: -5 },
    ],
  );
  for (const station of [-2, 0, 4, 10, 12]) {
    const actual: Jet | null | undefined = level.jet?.(station);
    if (actual === null || actual === undefined)
      failures.push("affine level jet is absent");
    else
      compare(
        actual,
        fixed([3 + 2 * station, station, 5 - station], [2, 1, -1]),
        1,
        "affine level",
        failures,
      );
  }
  const root: AutoMovieViewParallelAxis.IOrigin = {
    x: {
      knots: [
        { site: "start", station: 0, value: 10 },
        { site: "end", station: 4, value: 12 },
      ],
      parameter: { type: "root", pole: 0, end: "bottom" },
    },
    y: {
      knots: [
        { site: "start", station: 0, value: 0 },
        { site: "end", station: 4, value: 4 },
      ],
    },
    z: {
      knots: [
        { site: "start", station: 0, value: 5 },
        { site: "end", station: 4, value: 1 },
      ],
    },
  };
  const parallel: AutoMovieViewAxis.IAxis | string =
    AutoMovieViewParallelAxis.create(root, [1, 0, 0], [0, 0, 1]);
  if (typeof parallel === "string") failures.push(parallel);
  else {
    if (parallel.at(0).origin[0] !== 10 || parallel.jet?.(0) !== null)
      failures.push(
        "nonzero root endpoint lost its finite value/singular qualification",
      );
    for (const station of [0.25, 1, 4]) {
      const actual: Jet | null | undefined = parallel.jet?.(station);
      const expected: Jet = fixed(
        [10 + Math.sqrt(station), station, 5 - station],
        [1 / (2 * Math.sqrt(station)), 1, -1],
      );
      expected.second.origin[0] = -1 / (4 * station ** 1.5);
      if (actual === null || actual === undefined)
        failures.push("regular parallel source jet is absent");
      else compare(actual, expected, 1, "parallel root interior", failures);
    }
  }
  const numerical: AutoMovieViewAxis.IAxis = AutoMovieViewAxis.minimal(
    [
      { station: 0, point: [0, 0, 0] },
      { station: 10, point: [0, 10, 0] },
    ],
    [1, 0, 0],
    1,
  );
  if (numerical.jet !== undefined)
    failures.push(
      "numerical minimal-rotation values claim exact source derivatives",
    );
  const wrong: Jet = fixed([0, 0, 0], [0, 1, 0]);
  wrong.second.u[0] = 0.01;
  const proof: string[] = [];
  compare(
    wrong,
    fixed([0, 0, 0], [0, 1, 0]),
    1,
    "made derivative defect",
    proof,
  );
  if (proof.length !== 1)
    failures.push("made derivative defect escaped the independent reader");
  TestValidator.predicate(
    `${failures.length} actual-axis jet findings:\n${failures.join("\n")}`,
    failures.length === 0,
  );
}

/** Explicit planar coordinates, differentiated with scalar dual arithmetic rather than vector Rodrigues/product code. */
function planar(
  station: number,
  start: number,
  half: number,
  scale: number,
  rolled: boolean,
): Jet {
  const share: number = (station - start) / (2 * half);
  const theta: Dual = multiply(
    [Math.PI / 2, 0, 0],
    smooth([share, 1 / (2 * half), 0]),
  );
  const alpha: Dual = rolled
    ? multiply(
        [Math.PI / 3, 0, 0],
        smooth([
          (station - start + 10 * scale) / (60 * scale),
          1 / (60 * scale),
          0,
        ]),
      )
    : [0, 0, 0];
  const st: Dual = sine(theta);
  const ct: Dual = cosine(theta);
  const sa: Dual = sine(alpha);
  const ca: Dual = cosine(alpha);
  const u: Dual[] = [negate(multiply(ca, st)), multiply(ca, ct), negate(sa)];
  const v: Dual[] = [multiply(sa, st), negate(multiply(sa, ct)), negate(ca)];
  const displacement: Vec3 = integral(Math.min(1, Math.max(0, share)), half);
  const full: Vec3 = integral(1, half);
  const origin: Vec3 =
    share < 0
      ? [station, 0, 0]
      : share > 1
        ? [100 * scale, full[1] + station - start - 2 * half, 0]
        : [start + displacement[0], displacement[1], 0];
  const result: Jet = fixed(origin, [ct[0], st[0], 0]);
  result.second.origin = [ct[1], st[1], 0];
  for (const [order, frame] of [
    [0, result.value],
    [1, result.first],
    [2, result.second],
  ] as const) {
    frame.u = u.map((value: Dual): number => value[order]) as Vec3;
    frame.v = v.map((value: Dual): number => value[order]) as Vec3;
  }
  return result;
}

/** Independent composite Simpson integral of the specified planar unit tangent over the turning arclength. */
function integral(share: number, half: number): Vec3 {
  const panels: number = 4096;
  const step: number = share / panels;
  const out: Vec3 = [0, 0, 0];
  for (let i: number = 0; i <= panels; i++) {
    const x: number = i * step;
    const angle: number =
      (Math.PI / 2) * (10 * x ** 3 - 15 * x ** 4 + 6 * x ** 5);
    const weight: number = i === 0 || i === panels ? 1 : i % 2 === 1 ? 4 : 2;
    out[0] += (weight * step * 2 * half * Math.cos(angle)) / 3;
    out[1] += (weight * step * 2 * half * Math.sin(angle)) / 3;
  }
  return out;
}

/** Constant chart basis with explicitly supplied origin derivatives. */
function fixed(origin: Vec3, first: Vec3): Jet {
  return {
    value: { origin, u: [1, 0, 0], v: [0, 0, 1] },
    first: { origin: first, u: [0, 0, 0], v: [0, 0, 0] },
    second: { origin: [0, 0, 0], u: [0, 0, 0], v: [0, 0, 0] },
  };
}

/** Read every derivative against its independent scalar-coordinate expectation. */
function compare(
  actual: Jet,
  expected: Jet,
  scale: number,
  label: string,
  failures: string[],
): void {
  for (const [order, key] of [
    [0, "value"],
    [1, "first"],
    [2, "second"],
  ] as const)
    for (const component of ["origin", "u", "v"] as const)
      for (let k: number = 0; k < 3; k++) {
        const physical: number = component === "origin" ? scale : 1;
        const bound: number =
          order === 0 && component === "origin"
            ? 1e-9 * scale
            : 512 *
              Number.EPSILON *
              Math.max(
                physical / scale ** order,
                Math.abs(expected[key][component][k]!),
              );
        if (
          !nclose(
            actual[key][component][k]!,
            expected[key][component][k]!,
            bound,
          )
        )
          failures.push(
            `${label} ${key}.${component}[${k}]: ${actual[key][component][k]}, expected ${expected[key][component][k]}`,
          );
      }
}

/** Multiplication in second-order derivative algebra. */
function multiply(a: Dual, b: Dual): Dual {
  return [
    a[0] * b[0],
    a[1] * b[0] + a[0] * b[1],
    a[2] * b[0] + 2 * a[1] * b[1] + a[0] * b[2],
  ];
}

/** Sum in second-order derivative algebra. */
function add(a: Dual, b: Dual): Dual {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/** Negation in derivative algebra. */
function negate(a: Dual): Dual {
  return [-a[0], -a[1], -a[2]];
}

/** Sine in derivative algebra. */
function sine(a: Dual): Dual {
  return [
    Math.sin(a[0]),
    Math.cos(a[0]) * a[1],
    Math.cos(a[0]) * a[2] - Math.sin(a[0]) * a[1] * a[1],
  ];
}

/** Cosine in derivative algebra. */
function cosine(a: Dual): Dual {
  return [
    Math.cos(a[0]),
    -Math.sin(a[0]) * a[1],
    -Math.sin(a[0]) * a[2] - Math.cos(a[0]) * a[1] * a[1],
  ];
}

/** The specification's quintic angle polynomial, constant outside its closed span. */
function smooth(x: Dual): Dual {
  if (x[0] <= 0) return [0, 0, 0];
  if (x[0] >= 1) return [1, 0, 0];
  const square: Dual = multiply(x, x);
  const cube: Dual = multiply(square, x);
  return multiply(
    cube,
    add([10, 0, 0], multiply(x, add([-15, 0, 0], multiply([6, 0, 0], x)))),
  );
}
