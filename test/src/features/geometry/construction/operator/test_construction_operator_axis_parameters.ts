import {
  type AutoMovieViewAxis,
  AutoMovieViewParallelAxis,
  AutoMovieViewParameter,
} from "@automovie/engine";
import type { AutoMovieConstructionOutlineParameter } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** One actual axis value and two selected-coordinate derivatives. */
type Jet = NonNullable<ReturnType<NonNullable<AutoMovieViewAxis.IAxis["jet"]>>>;

/** A source component triple. */
type Vec3 = [number, number, number];

/**
 * Shared-pole coordinates keep finite parameter jets distinct from singular station jets.
 *
 * Scenarios:
 * 1. Independent bottom/top root and angle inverse derivatives, same-pole transfers and unequal angle spans agree at their finite endpoint limits in millimetre and metre-congruent scales.
 * 2. Opposed inward sides or a singular source in a regular target have no finite transfer. Large finite angle inverses avoid product overflow, while an unrepresentable coordinate ratio and invalid stations return null.
 * 3. An actual parallel-axis factory consumes X root, Y angle and Z station sources together. Both endpoint values and angle derivatives agree with their explicit scalar laws while physical-station jets remain null.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the public inverse/transfer producer and the actual parallel-axis consumer, checking both derivative orders, endpoint values and honest unavailable station jets.
 * @evidence contracts/testing.md#independent-expectations Direct differentiation of signed square root and s=b+(t-b)sin(q/2)^2 gives endpoint derivatives and coordinate ratios. The mixed-source coordinates have explicit linear/root and three-knot natural angle laws. All copied expectations and limits are unchanged from the original combined axis test: scalar pairs use 512 binary64 epsilons times their exact magnitude; frame derivative components use the original congruent natural scale and values retain its 1e-9 physical-scale observer allowance.
 * @evidence contracts/testing.md#distinguishing-cases Covers bottom/top and common-pole transfers, unequal spans, opposite sides, mixed source coordinates at congruent scales 1 and 1000, finite values with null station derivatives, overflow and invalid queries. No finite endpoint derivative or unsupported transfer is substituted.
 * @evidence contracts/testing.md#execution-ownership Discoverable synchronous CPU operator test through --include construction_operator_axis_parameters; construction_ also discovers it. It starts no process, Human generation, viewer or GPU.
 */
export function test_construction_operator_axis_parameters(): void {
  const failures: string[] = [];
  const pair: (
    label: string,
    actual: [number, number] | null,
    expected: [number, number] | null,
  ) => void = (
    label: string,
    actual: [number, number] | null,
    expected: [number, number] | null,
  ): void => {
    if (expected === null) {
      if (actual !== null)
        failures.push(`${label}: an unavailable coordinate jet was fabricated`);
      return;
    }
    if (actual === null) {
      failures.push(`${label}: finite coordinate jet is absent`);
      return;
    }
    for (let k: number = 0; k < 2; k++)
      if (
        !nclose(
          actual[k]!,
          expected[k]!,
          512 * Number.EPSILON * Math.abs(expected[k]!),
        )
      )
        failures.push(`${label}[${k}]: ${actual[k]}, expected ${expected[k]}`);
  };
  for (const scale of [1, 1000]) {
    const angle: AutoMovieConstructionOutlineParameter = {
      type: "angle",
      bottom: 0,
      top: 4 * scale,
    };
    const bottom: AutoMovieConstructionOutlineParameter = {
      type: "root",
      pole: 0,
      end: "bottom",
    };
    const top: AutoMovieConstructionOutlineParameter = {
      type: "root",
      pole: 4 * scale,
      end: "top",
    };
    pair(
      "bottom root inverse",
      AutoMovieViewParameter.inverseJet(bottom, 0),
      [0, 2],
    );
    pair(
      "top root inverse",
      AutoMovieViewParameter.inverseJet(top, 4 * scale),
      [0, -2],
    );
    pair("angle bottom inverse", AutoMovieViewParameter.inverseJet(angle, 0), [
      0,
      2 * scale,
    ]);
    pair(
      "angle top inverse",
      AutoMovieViewParameter.inverseJet(angle, 4 * scale),
      [0, -2 * scale],
    );
    pair(
      "equal copied root",
      AutoMovieViewParameter.transferJet(bottom, { ...bottom }, 0),
      [1, 0],
    );
    pair(
      "root from angle bottom",
      AutoMovieViewParameter.transferJet(bottom, angle, 0),
      [Math.sqrt(scale), 0],
    );
    pair(
      "root from angle opposite pole",
      AutoMovieViewParameter.transferJet(bottom, angle, 4 * scale),
      [0, -Math.sqrt(scale) / 2],
    );
    pair(
      "top root from angle",
      AutoMovieViewParameter.transferJet(top, angle, 4 * scale),
      [Math.sqrt(scale), 0],
    );
    pair(
      "top root from angle opposite pole",
      AutoMovieViewParameter.transferJet(top, angle, 0),
      [0, Math.sqrt(scale) / 2],
    );
    pair(
      "angle from bottom root",
      AutoMovieViewParameter.transferJet(angle, bottom, 0),
      [1 / Math.sqrt(scale), 0],
    );
    pair(
      "angle from top root",
      AutoMovieViewParameter.transferJet(angle, top, 4 * scale),
      [1 / Math.sqrt(scale), 0],
    );
    pair(
      "shared bottom unequal angles",
      AutoMovieViewParameter.transferJet(
        angle,
        { type: "angle", bottom: 0, top: 9 * scale },
        0,
      ),
      [1.5, 0],
    );
    pair(
      "shared top unequal angles",
      AutoMovieViewParameter.transferJet(
        angle,
        { type: "angle", bottom: -5 * scale, top: 4 * scale },
        4 * scale,
      ),
      [1.5, 0],
    );
    pair(
      "singular source in regular target",
      AutoMovieViewParameter.transferJet(
        angle,
        { type: "root", pole: -scale, end: "bottom" },
        0,
      ),
      null,
    );
    pair(
      "opposed inward sides",
      AutoMovieViewParameter.transferJet(
        bottom,
        { type: "root", pole: 0, end: "top" },
        0,
      ),
      null,
    );
    const origin: AutoMovieViewParallelAxis.IOrigin = {
      x: {
        knots: [
          { site: "start", station: 0, value: 10 * scale },
          { site: "end", station: 4 * scale, value: 12 * scale },
        ],
        parameter: bottom,
      },
      y: {
        knots: [
          { site: "start", station: 0, value: 10 * scale },
          { site: "middle", station: 2 * scale, value: 11 * scale },
          { site: "end", station: 4 * scale, value: 10 * scale },
        ],
        parameter: angle,
      },
      z: {
        knots: [
          { site: "start", station: 0, value: 0 },
          { site: "end", station: 4 * scale, value: 4 * scale },
        ],
      },
    };
    const axis: AutoMovieViewAxis.IAxis | string =
      AutoMovieViewParallelAxis.create(origin, [1, 0, 0], [0, 0, 1]);
    if (typeof axis === "string") {
      failures.push(axis);
      continue;
    }
    for (const end of [0, 1]) {
      const station: number = end * 4 * scale;
      if (axis.jet?.(station) !== null)
        failures.push("mixed source endpoint invented a finite station jet");
      const actual: Jet | null | undefined = axis.jet?.(station, angle);
      const expected: Jet = fixed(
        [(10 + 2 * end) * scale, 10 * scale, end * 4 * scale],
        [
          end === 0 ? scale : 0,
          ((end === 0 ? 1 : -1) * 3 * scale) / Math.PI,
          0,
        ],
      );
      expected.second.origin = [
        end === 0 ? 0 : -scale / 2,
        0,
        (end === 0 ? 1 : -1) * 2 * scale,
      ];
      if (actual === null || actual === undefined)
        failures.push("finite mixed-source angle jet was lost");
      else
        compare(
          actual,
          expected,
          scale,
          "mixed actual parameter endpoint",
          failures,
        );
    }
  }
  pair(
    "large angle inverse without a*b overflow",
    AutoMovieViewParameter.inverseJet(
      { type: "angle", bottom: 0, top: 1e308 },
      5e307,
    ),
    [5e307, 0],
  );
  pair(
    "unrepresentable shared-pole ratio",
    AutoMovieViewParameter.transferJet(
      { type: "angle", bottom: 0, top: Number.MIN_VALUE },
      { type: "angle", bottom: 0, top: Number.MAX_VALUE },
      0,
    ),
    null,
  );
  for (const station of [NaN, Infinity, -1])
    pair(
      "invalid angle query",
      AutoMovieViewParameter.inverseJet(
        { type: "angle", bottom: 0, top: 4 },
        station,
      ),
      null,
    );
  TestValidator.predicate(
    `${failures.length} axis-parameter findings:\n${failures.join("\n")}`,
    failures.length === 0,
  );
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
