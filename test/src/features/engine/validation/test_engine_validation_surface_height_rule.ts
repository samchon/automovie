import {
  AutoMovieEngineValidation,
  AutoMovieEngineViolationCollector,
} from "@automovie/engine";
import type { IAutoMovieHeightRule } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Admit the numerical inputs used by the world height reader.
 *
 * Scenarios:
 *
 * 1. Finite constant, signed plane and complete heightfield records pass.
 * 2. Nonfinite scalar values and invalid lattice pitch each report their path.
 * 3. Too small, fractional and unsafe dimensions report the affected axis.
 * 4. Missing, sparse and nonfinite samples report the count or sample index.
 * 5. A rounded-together axis reports the spacing which collapses its knots.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios name each field family and the exact level at which its refusal is reported.
 * @evidence contracts/development/testing.md#behavioral-verification Passes authored rules to the public Engine validator and compares the collected paths for all admitted and refused cases as one batch.
 * @evidence contracts/development/testing.md#independent-expectations A 2 by 2 grid needs four samples, 2.5 is not an integer, and adding a one-metre pitch at 2^54 metres rounds to the same coordinate. The expected field paths are authored alongside those inputs.
 */
export function test_engine_validation_surface_height_rule(): void {
  const lattice: IAutoMovieHeightRule.IHeightfield = {
    kind: "heightfield",
    originX: -2,
    originZ: 3,
    spacingX: 1,
    spacingZ: 2,
    columns: 2,
    rows: 2,
    samples: [-1, 0, 1, 2],
  };
  const sparse: number[] = new Array<number>(4);
  sparse[0] = -1;
  sparse[1] = 0;
  sparse[3] = 2;
  const cases: readonly [string, IAutoMovieHeightRule, readonly string[]][] = [
    ["constant", { kind: "constant", value: -1 }, []],
    ["plane", { kind: "plane", originHeight: 2, slopeX: 0, slopeZ: -1 }, []],
    ["heightfield", lattice, []],
    ["constant infinity", { kind: "constant", value: Infinity }, ["value"]],
    [
      "plane nonfinite values",
      { kind: "plane", originHeight: NaN, slopeX: -Infinity, slopeZ: Infinity },
      ["originHeight", "slopeX", "slopeZ"],
    ],
    [
      "lattice nonfinite scalar inputs",
      {
        ...lattice,
        originX: NaN,
        originZ: Infinity,
        spacingX: NaN,
        spacingZ: Infinity,
      },
      ["originX", "originZ", "spacingX", "spacingZ"],
    ],
    ["zero pitch", { ...lattice, spacingX: 0 }, ["spacingX"]],
    [
      "fractional columns",
      { ...lattice, columns: 2.5, samples: [0, 0, 0, 0, 0] },
      ["columns"],
    ],
    ["one row", { ...lattice, rows: 1 }, ["rows"]],
    [
      "unsafe row count",
      { ...lattice, rows: Number.MAX_SAFE_INTEGER + 1 },
      ["rows"],
    ],
    ["short sample list", { ...lattice, samples: [0, 0, 0] }, ["samples"]],
    ["sparse sample list", { ...lattice, samples: sparse }, ["samples[2]"]],
    [
      "nonfinite sample",
      { ...lattice, samples: [-1, 0, Infinity, 2] },
      ["samples[2]"],
    ],
    ["coincident X knots", { ...lattice, originX: 2 ** 54 }, ["spacingX"]],
  ];
  const actual = cases.map(([name, rule]) => {
    const collector: AutoMovieEngineViolationCollector =
      new AutoMovieEngineViolationCollector();
    AutoMovieEngineValidation.validateSurfaceHeightRule(
      rule,
      "$height",
      collector,
    );
    return [name, collector.items.map(({ path }) => path)];
  });
  const expected = cases.map(([name, , paths]) => [
    name,
    paths.map((path) => `$height.${path}`),
  ]);
  TestValidator.equals("surface height admission paths", actual, expected);
}
