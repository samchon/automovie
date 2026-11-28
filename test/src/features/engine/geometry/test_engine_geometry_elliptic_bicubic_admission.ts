import { AutoMovieEngineGeometry } from "@automovie/engine";
import type {
  IAutoMovieBicubicAtlasGeometry,
  IAutoMovieCreateEllipticLoftAtlas,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * Elliptic generation publishes finite metre coefficients at the exact
 * stations. Model atlas admission preserves independent finite patches when a
 * declared coefficient, ordinal or canonical interval is malformed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies exact station interpolation, the distinct producer and model limits, and the scope of recoverable atlas omissions.
 * @evidence contracts/development/testing.md#behavioral-verification Generates an ellipse from direct metre profiles and checks its rows and errors. Runs structural admission and realization on paired patch occurrences, corrupting one coefficient, control address or boundary record at a time.
 * @evidence contracts/development/testing.md#independent-expectations A cubic axial line has rows at lower Y, one third, two thirds and upper Y. A unit maximum radius gives deviation bound 0.000273. Only the sixteen original controls of the second independent affine patch survive each local defect, yielding its two triangles.
 */
export function test_engine_geometry_elliptic_bicubic_admission(): void {
  const engine = AutoMovieEngineGeometry;
  const span: IAutoMovieCreateEllipticLoftAtlas.IInput["loft"]["spans"][number] =
    {
      interval: { lowerY: 0, upperY: 1 },
      radiusX: [1, 1, 1, 1],
      radiusZ: [0.5, 0.5, 0.5, 0.5],
      centreX: [0, 0, 0, 0],
      centreZ: [0, 0, 0, 0],
    };
  const loft: IAutoMovieCreateEllipticLoftAtlas.IInput = {
    loft: { spans: [span] },
    topologyDomain: "independent-admission",
    tolerance: 0.01,
    maxCells: 1,
    maxVertices: 1,
  };
  const generated = engine.createEllipticLoftAtlas(loft);
  const rows = (result: IAutoMovieCreateEllipticLoftAtlas.IResult): number[] =>
    [0, 12, 24, 36].map((index) => result.geometry.controls[index]!.y);
  TestValidator.equals("basic stations", rows(generated), [0, 1 / 3, 2 / 3, 1]);
  TestValidator.equals(
    "producer-only budget and unit radius",
    [generated.geometry.maxVertices, generated.arcDeviationBound],
    [1, 0.000273],
  );
  const generateBetween = (lowerY: number, upperY: number) =>
    engine.createEllipticLoftAtlas({
      ...loft,
      loft: { spans: [{ ...span, interval: { lowerY, upperY } }] },
    });
  const large: number = 1e308;
  const [first, left, right, last] = rows(generateBetween(-large, large));
  TestValidator.equals(
    "large authored endpoints",
    [first, last],
    [-large, large],
  );
  TestValidator.predicate(
    "bounded convex intermediate rows",
    Math.abs(left! / large + 1 / 3) < 1e-15 &&
      Math.abs(right! / large - 1 / 3) < 1e-15,
  );
  TestValidator.equals(
    "exact endpoint survives cancellation",
    rows(generateBetween(-1e16, 1))[3],
    1,
  );
  const tiny: number = Number.MIN_VALUE;
  TestValidator.equals(
    "positive deviation bound survives underflow",
    engine.createEllipticLoftAtlas({
      ...loft,
      loft: {
        spans: [
          {
            ...span,
            radiusX: [tiny, tiny, tiny, tiny],
            radiusZ: [tiny, tiny, tiny, tiny],
          },
        ],
      },
    }).arcDeviationBound,
    tiny,
  );
  for (const override of [
    { tolerance: Infinity },
    { tolerance: NaN },
    { maxCells: 0.5 },
    { maxVertices: NaN },
  ])
    TestValidator.predicate(
      "producer policy refusal",
      throwsError(
        () => engine.createEllipticLoftAtlas({ ...loft, ...override }),
        "positive atlas budgets",
      ),
    );
  const invalidSpans: [typeof span, string][] = [
    [
      { ...span, interval: { lowerY: 0, upperY: Infinity } },
      "finite, increasing",
    ],
    [{ ...span, centreX: [0, NaN, 0, 0] }, "centres need finite"],
    [{ ...span, radiusX: [1, Infinity, 1, 1] }, "positive finite"],
    [
      {
        ...span,
        centreX: [large, large, large, large],
        radiusX: [large, large, large, large],
      },
      "not representable in model metres",
    ],
  ];
  for (const [bad, message] of invalidSpans)
    TestValidator.predicate(
      "producer coefficient refusal",
      throwsError(
        () =>
          engine.createEllipticLoftAtlas({ ...loft, loft: { spans: [bad] } }),
        message,
      ),
    );

  const ids = Array.from({ length: 16 }, (_, index) => index);
  const plane = ids.map((id) => ({ x: id % 4, y: 0, z: Math.floor(id / 4) }));
  const atlas: IAutoMovieBicubicAtlasGeometry = {
    type: "bicubic-atlas",
    topologyDomain: loft.topologyDomain,
    controls: [...plane, ...plane],
    patches: [
      { id: "first", controlIds: ids },
      { id: "independent", controlIds: ids.map((id) => id + 16) },
    ],
    tolerance: 0.01,
    maxCells: 64,
    maxVertices: 1000,
  };
  TestValidator.equals(
    "ordinary model ordinals",
    engine.admitBicubicAtlas(atlas).patches,
    [0, 1],
  );
  TestValidator.predicate(
    "subnormal positive model tolerance",
    engine.realizeBicubicAtlas64({ ...atlas, tolerance: tiny }).complete,
  );
  const starved = engine.realizeBicubicAtlas64({
    ...atlas,
    maxCells: 1,
    maxVertices: 3,
  });
  TestValidator.equals(
    "small model budget is an incomplete result",
    [starved.complete, starved.mesh.indices!.length],
    [false, 3],
  );
  for (const override of [
    { tolerance: Infinity },
    { tolerance: 1e307 },
    { maxCells: NaN },
    { maxCells: 1.5 },
    { maxVertices: 3.5 },
    { maxVertices: 2 },
    {
      cellBudgetPolicy:
        "unknown" as IAutoMovieBicubicAtlasGeometry["cellBudgetPolicy"],
    },
  ])
    TestValidator.predicate(
      "model global policy refusal",
      throwsError(
        () => engine.admitBicubicAtlas({ ...atlas, ...override }),
        "safe cell and vertex budgets",
      ),
    );

  const bound: IAutoMovieBicubicAtlasGeometry = {
    ...atlas,
    boundaryAuthorities: [{ id: "edge", controlIds: [0, 1, 2, 3] }],
    boundaryBindings: [
      {
        patch: "first",
        side: 0,
        authority: "edge",
        start: 0,
        end: 1,
        normalFan: "face",
      },
    ],
  };
  const refusals: readonly [IAutoMovieBicubicAtlasGeometry, string][] = [
    [
      {
        ...atlas,
        controls: [{ x: NaN, y: 0, z: 0 }, ...atlas.controls.slice(1)],
      },
      "controls[0]",
    ],
    [
      {
        ...atlas,
        controls: [{ x: 1e307, y: 0, z: 0 }, ...atlas.controls.slice(1)],
      },
      "controls[0]",
    ],
    [
      {
        ...atlas,
        patches: [
          { id: "first", controlIds: [0.5, ...ids.slice(1)] },
          atlas.patches[1]!,
        ],
      },
      "patches[0]",
    ],
    [
      {
        ...bound,
        boundaryAuthorities: [{ id: "edge", controlIds: [0.5, 1, 2, 3] }],
      },
      "invalid canonical boundary authority",
    ],
    [
      {
        ...bound,
        boundaryBindings: [{ ...bound.boundaryBindings![0]!, start: NaN }],
      },
      "invalid canonical boundary binding first:0",
    ],
  ];
  for (const [recipe, diagnostic] of refusals) {
    const admitted = engine.admitBicubicAtlas(recipe);
    TestValidator.equals(
      "independent original chart and coefficient ordinals",
      [admitted.patches, admitted.controls],
      [[1], ids.map((id) => id + 16)],
    );
    TestValidator.predicate(
      "localized diagnostic",
      admitted.diagnostics.some((message) => message.includes(diagnostic)),
    );
    const realized = engine.realizeBicubicAtlas64(recipe);
    TestValidator.equals(
      "independent patch stays displayable",
      [
        realized.complete,
        realized.primitiveRanges.map((range) => range.patch),
        realized.mesh.indices!.length,
      ],
      [false, ["independent"], 6],
    );
  }
  const untrustedFit = engine.admitBicubicAtlas({
    ...atlas,
    sourceFit: {
      maximumResidual: Infinity,
      qualified: true,
      diagnostics: [],
      unqualifiedPatches: [],
    },
  });
  TestValidator.equals(
    "source-fit metadata leaves structural charts",
    untrustedFit.patches,
    [0, 1],
  );
  TestValidator.predicate(
    "nonfinite fit residual diagnostic",
    untrustedFit.diagnostics.some((message) =>
      message.includes("Malformed source-fit"),
    ),
  );
  TestValidator.predicate(
    "empty model rejects malformed retention policy",
    throwsError(
      () =>
        engine.realizeBicubicAtlas64(
          { ...atlas, patches: [] },
          { retainPatchCoefficients: "yes" as unknown as boolean },
        ),
      "retention flags must be boolean",
    ),
  );
}
