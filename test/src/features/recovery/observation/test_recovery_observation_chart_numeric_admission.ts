import type {
  IAutoMovieRecoveryChartBoxSolve,
  IAutoMovieRecoveryChartControlRelations,
  IAutoMovieRecoveryChartFit,
  IAutoMovieRecoveryChartFitRows,
  IAutoMovieRecoveryChartMap,
} from "@automovie/interface";
import {
  AutoMovieRecoveryChartFit,
  AutoMovieRecoveryChartMap,
  AutoMovieRecoveryObservation,
} from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError } from "../../internal/predicates";

/**
 * Verify numeric admission for chart boxes, harmonic maps, fitted charts, row
 * streams and affine relations. A legal low work cap retains a measured result.
 * Malformed values throw at their owning boundary.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the numerical entry points, legal incomplete results and refusal boundaries, including a valid prefix of a derivative stream.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public entry points with bounded work, finite controls, sparse and nonfinite data, improper indices, and a zero-weight dependency cycle. Checks the computed values and exact refusal locations.
 * @evidence contracts/development/testing.md#independent-expectations The identity Gram has minimizer one and objective minus one half. The free chart vertices solve to two and three fifths. The constant fit is three millimetres from x=4. At the chart origin, the cubic position uses coefficient zero and each directional stencil is the edge difference times three. The declared affine law is twice the fixed point minus the original free control.
 */
export function test_recovery_observation_chart_numeric_admission(): void {
  type Box = Parameters<IAutoMovieRecoveryChartBoxSolve.Operation>[0];
  const box: Box = {
    hessian: [[[0, 1]]],
    rhs: [1, 0, 0],
    lower: [0, -1, -1],
    upper: [2, 1, 1],
    gradientTolerance: 0,
    maxIterations: 4,
  };
  const solve = AutoMovieRecoveryObservation.solveChartBox;
  const converged = solve(box);
  TestValidator.equals(
    "identity Gram minimizer",
    [...converged.values],
    [1, 0, 0],
  );
  TestValidator.equals(
    "identity Gram diagnostics",
    [converged.iterations, converged.objective, converged.projectedGradient],
    [1, -0.5, 0],
  );
  const coupled: Box = {
    ...box,
    hessian: [
      [
        [0, 2],
        [1, 1],
      ],
      [
        [0, 1],
        [1, 2],
      ],
    ],
    rhs: [1, 0, 0, 0, 0, 0],
    maxIterations: 1,
  };
  const limitedBox = solve(coupled);
  TestValidator.predicate(
    "one coupled proposal leaves a positive projected gradient",
    limitedBox.iterations === 1 &&
      nclose(limitedBox.values[0]!, 1 / 3) &&
      nclose(limitedBox.projectedGradient, 1 / 3) &&
      nclose(limitedBox.objective, -2 / 9),
  );
  const extreme = Number.MAX_VALUE;
  const unseen = solve({
    ...box,
    hessian: [[]],
    rhs: [0, 0, 0],
    lower: [-extreme, -1, -1],
    upper: [extreme, 1, 1],
    initialValues: [-extreme, 0, 0],
  });
  TestValidator.equals(
    "unseen finite warm start stays unchanged",
    [...unseen.values, unseen.iterations, unseen.projectedGradient],
    [-extreme, 0, 0, 0, 0],
  );
  TestValidator.equals(
    "empty box has no coordinates",
    [...solve({ ...box, hessian: [], rhs: [] }).values],
    [],
  );
  const boxRefusals: [string, Partial<Box>, string][] = [
    ["NaN cap", { maxIterations: NaN }, "budgets"],
    ["infinite cap", { maxIterations: Infinity }, "budgets"],
    ["fractional cap", { maxIterations: 1.5 }, "budgets"],
    ["unsafe cap", { maxIterations: Number.MAX_SAFE_INTEGER + 1 }, "budgets"],
    ["infinite gradient tolerance", { gradientTolerance: Infinity }, "budgets"],
    ["nonfinite lower", { lower: [NaN, -1, -1] }, "endpoints"],
    ["reversed endpoints", { lower: [3, -1, -1] }, "endpoints"],
    ["sparse RHS", { rhs: new Array<number>(3) }, "finite entries"],
    ["infinite RHS", { rhs: [Infinity, 0, 0] }, "finite entries"],
    ["nonfinite warm start", { initialValues: [NaN, 0, 0] }, "finite feasible"],
    [
      "sparse warm start",
      { initialValues: new Array<number>(3) },
      "finite feasible",
    ],
    ["infeasible warm start", { initialValues: [3, 0, 0] }, "finite feasible"],
    ["fractional Gram column", { hessian: [[[0.5, 1]]] }, "Sparse Gram"],
    [
      "nonfinite Gram coefficient",
      { hessian: [[[0, Infinity]]] },
      "Sparse Gram",
    ],
    [
      "sparse Gram row",
      { hessian: new Array<Box["hessian"][number]>(1) },
      "sparse Gram row",
    ],
  ];
  for (const [name, edit, reason] of boxRefusals)
    TestValidator.predicate(
      name,
      throwsError(() => solve({ ...box, ...edit }), reason),
    );
  TestValidator.predicate(
    "finite Gram coefficients can exceed the reported row norm range",
    throwsError(
      () =>
        solve({
          ...coupled,
          hessian: [
            [
              [0, extreme],
              [1, extreme],
            ],
            [
              [0, extreme],
              [1, extreme],
            ],
          ],
        }),
      "Original Gram row norm",
    ),
  );

  const square: IAutoMovieRecoveryChartMap.Input = {
    vertices: 6,
    triangles: [
      [0, 1, 4],
      [0, 4, 3],
      [3, 4, 5],
      [3, 5, 2],
      [4, 1, 5],
      [1, 2, 5],
    ],
    fixed: [
      { vertex: 0, u: 0, v: 0 },
      { vertex: 1, u: 1, v: 0 },
      { vertex: 2, u: 1, v: 1 },
      { vertex: 3, u: 0, v: 1 },
    ],
    tolerance: 1e-12,
    maxIterations: 10,
  };
  const parameterize = AutoMovieRecoveryChartMap.parameterize;
  const harmonic = parameterize(square);
  TestValidator.predicate(
    "free UVs solve the coupled original Laplacian",
    harmonic.qualified &&
      harmonic.residual <= square.tolerance &&
      harmonic.parameters[4]!.every((value) => nclose(value, 2 / 5)) &&
      harmonic.parameters[5]!.every((value) => nclose(value, 3 / 5)),
  );
  TestValidator.equals(
    "source-order anchor coordinates",
    harmonic.parameters.slice(0, 4),
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
  );
  const limitedMap = parameterize({ ...square, maxIterations: 1 });
  TestValidator.equals(
    "map budget counts by axis",
    limitedMap.iterations,
    [1, 1],
  );
  TestValidator.predicate(
    "one map step retains valid coordinates with unresolved equations",
    !limitedMap.qualified &&
      nclose(limitedMap.residual, 3 / 8) &&
      limitedMap.failedTriangles.length === 0,
  );
  const reversed = parameterize({
    ...square,
    triangles: square.triangles.map(([a, b, c]): [number, number, number] => [
      a,
      c,
      b,
    ]),
  });
  TestValidator.equals(
    "reversed map keeps original failed triangle addresses",
    reversed.failedTriangles,
    [0, 1, 2, 3, 4, 5],
  );
  TestValidator.equals(
    "reversed map remains an unqualified result",
    reversed.qualified,
    false,
  );
  const mapRefusals: [
    string,
    Partial<IAutoMovieRecoveryChartMap.Input>,
    string,
  ][] = [
    ["fractional vertices", { vertices: 6.5 }, "parameterization budgets"],
    ["NaN vertices", { vertices: NaN }, "parameterization budgets"],
    ["NaN map cap", { maxIterations: NaN }, "parameterization budgets"],
    ["fractional map cap", { maxIterations: 1.5 }, "parameterization budgets"],
    [
      "infinite map tolerance",
      { tolerance: Infinity },
      "parameterization budgets",
    ],
    [
      "fractional triangle address",
      { triangles: [[0, 1, 1.5]] },
      "triangle addresses are invalid",
    ],
    [
      "NaN triangle address",
      { triangles: [[0, 1, NaN]] },
      "triangle addresses are invalid",
    ],
    [
      "sparse triangle",
      { triangles: new Array<readonly [number, number, number]>(1) },
      "three distinct addresses",
    ],
    [
      "fractional anchor address",
      { fixed: [{ vertex: 0.5, u: 0, v: 0 }] },
      "finite fixed chart coordinates",
    ],
    [
      "nonfinite anchor coordinate",
      { fixed: [{ vertex: 0, u: Infinity, v: 0 }] },
      "finite fixed chart coordinates",
    ],
    ["missing connected anchor", { fixed: [] }, "fixed boundary or guide"],
  ];
  for (const [name, edit, reason] of mapRefusals)
    TestValidator.predicate(
      name,
      throwsError(() => parameterize({ ...square, ...edit }), reason),
    );

  type Fit = IAutoMovieRecoveryChartFit.Input;
  const observation: Fit["observations"][number] = {
    patch: 0,
    u: 0.25,
    v: 0.75,
    pointMm: [1, 2, 3],
    weight: 1,
  };
  const patch: Fit["patches"][number] = {
    id: "patch.0",
    controlIds: new Array<number>(16).fill(0),
    parameterBounds: [0.2, 0.6, 0.3, 0.9],
  };
  const sample: Fit = {
    controls: [[1, 2, 3]],
    patches: [patch],
    observations: [observation],
    enclosureMm: { lower: [0, 0, 0], upper: [3, 4, 5] },
    toleranceMm: 0.01,
    gradientTolerance: 1e-9,
    maxIterations: 6,
  };
  const fit = AutoMovieRecoveryChartFit.fit;
  const exact = fit(sample);
  const free = fit({ ...sample, controls: [null] });
  TestValidator.predicate(
    "constant fixed and free charts both fit exactly",
    exact.qualified &&
      free.qualified &&
      nclose(exact.rmsMm, 0) &&
      nclose(free.rmsMm, 0),
  );
  TestValidator.equals(
    "joint fit returns the constant physical control",
    free.controls,
    [[1, 2, 3]],
  );
  const unseenFit = fit({ ...sample, controls: [null, null] });
  TestValidator.predicate(
    "insufficient observed rank remains an unqualified fit",
    !unseenFit.qualified &&
      unseenFit.unsupportedControls === 1 &&
      Number.isFinite(unseenFit.rmsMm),
  );
  const checked = fit({
    ...sample,
    validation: [{ ...observation, pointMm: [4, 2, 3] }],
  });
  TestValidator.predicate(
    "outside-enclosure check contributes to maximum but stays outside objective",
    !checked.qualified &&
      nclose(checked.maximumMm, 3) &&
      nclose(checked.rmsMm, 0),
  );
  TestValidator.equals(
    "witness preserves [uMin, uMax, vMin, vMax]",
    checked.maximumWitness?.leafBounds,
    patch.parameterBounds,
  );
  TestValidator.predicate(
    "witness converts each local axis against its corresponding bounds",
    !!checked.maximumWitness?.globalUV &&
      nclose(checked.maximumWitness.globalUV[0], 0.3) &&
      nclose(checked.maximumWitness.globalUV[1], 0.75),
  );

  const fitRefusals: [string, Partial<Fit>, string][] = [
    [
      "nonfinite fit tolerance",
      { toleranceMm: Infinity },
      "positive fit budgets",
    ],
    [
      "nonfinite fit gradient tolerance",
      { gradientTolerance: Infinity },
      "positive fit budgets",
    ],
    ["NaN fit cap", { maxIterations: NaN }, "positive fit budgets"],
    ["fractional fit cap", { maxIterations: 4.5 }, "positive fit budgets"],
    [
      "nonfinite fit enclosure",
      { enclosureMm: { ...sample.enclosureMm, lower: [NaN, 0, 0] } },
      "finite constrained chart",
    ],
    [
      "nonfinite fixed control",
      { controls: [[NaN, 2, 3]] },
      "Fixed curve controls",
    ],
    [
      "sparse fixed control registry",
      { controls: new Array<Fit["controls"][number]>(1) },
      "Fixed curve controls",
    ],
    [
      "nonfinite prolonged control",
      { initialControlsMm: [[NaN, 2, 3]] },
      "prolonged coefficient",
    ],
    [
      "nonfinite fit observation",
      { observations: [{ ...observation, pointMm: [NaN, 2, 3] }] },
      "Finite chart-local point",
    ],
    [
      "nonfinite fit weight",
      { observations: [{ ...observation, weight: Infinity }] },
      "Finite chart-local point",
    ],
    [
      "fractional fit observation patch",
      { observations: [{ ...observation, patch: 0.5 }] },
      "Finite chart-local point",
    ],
    [
      "NaN fit U",
      { observations: [{ ...observation, u: NaN }] },
      "Finite chart-local point",
    ],
    [
      "nonfinite fit validation",
      { validation: [{ ...observation, pointMm: [NaN, 2, 3] }] },
      "validation correspondences",
    ],
    [
      "NaN validation V",
      { validation: [{ ...observation, v: NaN }] },
      "validation correspondences",
    ],
    [
      "fractional patch control ID",
      {
        patches: [
          { ...patch, controlIds: [...patch.controlIds.slice(0, 15), 0.5] },
        ],
      },
      "sixteen valid control identities",
    ],
    [
      "nonfinite patch bounds",
      { patches: [{ ...patch, parameterBounds: [NaN, 0.6, 0.3, 0.9] }] },
      "ordered normalized U and V",
    ],
    [
      "fractional row work cap",
      { relationBudget: { maxTerms: 1, maxDepth: 0, maxRowTerms: 16.5 } },
      "observation-stencil budget",
    ],
  ];
  for (const [name, edit, reason] of fitRefusals)
    TestValidator.predicate(
      name,
      throwsError(() => fit({ ...sample, ...edit }), reason),
    );

  type Row = Parameters<IAutoMovieRecoveryChartFitRows.Operation>[0];
  const corner: Row = { u: 0, v: 0, pointMm: [1, 2, 3] };
  const tangent: NonNullable<Row["physicalJet"]> = {
    directions: [
      { du: 1, dv: 0, targetMm: [1, 0, 0] },
      { du: 0, dv: 1, targetMm: [0, 1, 0] },
    ],
  };
  const stream = AutoMovieRecoveryObservation.streamChartFitRows;
  const rows = [...stream({ ...corner, physicalJet: tangent })];
  TestValidator.equals(
    "corner stencil emits one position then two signed derivatives",
    rows.map((row) => [row.kind, row.coefficients.slice(0, 5), row.mass]),
    [
      ["position", [1, 0, 0, 0, 0], 1],
      ["physical-gradient", [-3, 3, 0, 0, 0], 0],
      ["physical-gradient", [-3, 0, 0, 0, 3], 0],
    ],
  );
  TestValidator.predicate(
    "NaN UV refuses before the first row",
    throwsError(
      () => stream({ ...corner, u: NaN }).next(),
      "Finite unit-chart",
    ),
  );
  TestValidator.predicate(
    "nonfinite position refuses before the first row",
    throwsError(
      () => stream({ ...corner, pointMm: [NaN, 2, 3] }).next(),
      "Finite unit-chart",
    ),
  );
  const badDerivatives: [
    string,
    NonNullable<Row["physicalJet"]>["directions"][number],
    string,
  ][] = [
    ["NaN operator", { ...tangent.directions[1]!, dv: NaN }, "Finite nonzero"],
    [
      "NaN derivative target",
      { ...tangent.directions[1]!, targetMm: [NaN, 0, 0] },
      "Finite nonzero",
    ],
    ["zero operator", { ...tangent.directions[1]!, dv: 0 }, "Finite nonzero"],
    [
      "finite operator overflow",
      { ...tangent.directions[1]!, dv: extreme },
      "row is unrepresentable",
    ],
  ];
  for (const [name, bad, reason] of badDerivatives) {
    const pending = stream({
      ...corner,
      physicalJet: { directions: [tangent.directions[0]!, bad] },
    });
    TestValidator.equals(
      name + " retains the validated prefix",
      [pending.next().value, pending.next().value],
      rows.slice(0, 2),
    );
    TestValidator.predicate(
      name + " refuses the invalid row",
      throwsError(() => pending.next(), reason),
    );
  }

  type Relations =
    Parameters<IAutoMovieRecoveryChartControlRelations.Operation>[0];
  const affine: Relations = {
    controls: 3,
    fixed: [{ id: 0, pointMm: [1, 2, 3] }],
    relations: [
      {
        id: 2,
        terms: [
          { id: 0, weight: 2 },
          { id: 1, weight: -1 },
        ],
      },
    ],
    maxTerms: 2,
    maxDepth: 1,
  };
  const relate = AutoMovieRecoveryObservation.relateChartControls;
  const related = relate(affine);
  TestValidator.equals(
    "affine independent registry follows original IDs",
    related.independent,
    [1],
  );
  TestValidator.equals(
    "signed affinity folds only the fixed source",
    related.expressions[2],
    {
      constant: [2, 4, 6],
      terms: [{ id: 1, weight: -1 }],
    },
  );
  TestValidator.equals(
    "exact zero cancellation keeps the fixed contribution",
    relate({
      ...affine,
      relations: [
        { id: 2, terms: [...affine.relations[0]!.terms, { id: 1, weight: 1 }] },
      ],
    }).expressions[2],
    { constant: [2, 4, 6], terms: [] },
  );
  TestValidator.equals(
    "zero depth admits an independent registry",
    relate({ ...affine, relations: [], maxDepth: 0 }).independent,
    [1, 2],
  );
  const relationRefusals: [string, Partial<Relations>, string][] = [
    [
      "fractional registry count",
      { controls: 3.5 },
      "finite sparse/depth budgets",
    ],
    ["NaN term cap", { maxTerms: NaN }, "finite sparse/depth budgets"],
    [
      "infinite depth cap",
      { maxDepth: Infinity },
      "finite sparse/depth budgets",
    ],
    [
      "fractional fixed ID",
      { fixed: [{ id: 0.5, pointMm: [1, 2, 3] }] },
      "Fixed controls",
    ],
    [
      "nonfinite fixed source",
      { fixed: [{ id: 0, pointMm: [NaN, 2, 3] }] },
      "Fixed controls",
    ],
    [
      "fractional dependent ID",
      { relations: [{ id: 2.5, terms: [] }] },
      "valid affine relation",
    ],
    [
      "fractional term ID",
      { relations: [{ id: 2, terms: [{ id: 0.5, weight: 0 }] }] },
      "finite weights",
    ],
    [
      "nonfinite term weight",
      { relations: [{ id: 2, terms: [{ id: 0, weight: NaN }] }] },
      "finite weights",
    ],
    [
      "zero-weight cycle",
      { relations: [{ id: 2, terms: [{ id: 2, weight: 0 }] }] },
      "dependency cycle",
    ],
    [
      "folded physical overflow",
      { fixed: [{ id: 0, pointMm: [extreme, 2, 3] }] },
      "folded affine position",
    ],
  ];
  for (const [name, edit, reason] of relationRefusals)
    TestValidator.predicate(
      name,
      throwsError(() => relate({ ...affine, ...edit }), reason),
    );
}
