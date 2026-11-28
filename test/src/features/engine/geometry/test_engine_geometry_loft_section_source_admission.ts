import {
  AutoMovieEngineConicArc,
  AutoMovieEngineLoftPhaseSource,
  AutoMovieEngineLoftSectionSource,
  AutoMovieEngineViewConic,
} from "@automovie/engine";
import type {
  IAutoMovieLoftChain,
  IAutoMovieLoftSectionSourceFamily,
  IAutoMovieViewConic,
  IAutoMovieViewSectionField,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * Bind only complete finite endpoint families and prepare representable native
 * phase interpolation. A valid basis and four-quarter native endpoint retain
 * their numeric data; invalid reached endpoint or station data is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two endpoint variants, the required rows, finite station conversion and explicit conic fixture.
 * @evidence contracts/development/testing.md#behavioral-verification Calls actual bind, endpoint and phase prepare/read with malformed families, copied invalid bindings, unrepresentable spacing and derivative maps, and verifies the admitted station's exact weights and point.
 * @evidence contracts/development/testing.md#independent-expectations Concentric circular sections of radii 8 and 12 have midpoint radius 10. Two natural knots give linear cardinal weights with slopes -1 and 1 and zero curvature; the supplied first and second coordinate derivatives scale those rows explicitly.
 */
export function test_engine_geometry_loft_section_source_admission(): void {
  const layer: IAutoMovieLoftChain.ILayer = {
    y: 1,
    coefficients: [1, 2],
    slopes: [3, 4],
    curvatures: [5, 6],
  };
  const basis: IAutoMovieLoftSectionSourceFamily = {
    kind: "basis",
    order: 1,
    rows: [
      [1, 2],
      [3, 4],
      [5, 6],
    ],
  };
  const extents: IAutoMovieViewSectionField.IStationJet[] = [
    [8, 1, -1],
    [9, 2, -2],
    [10, 3, -3],
    [11, 4, -4],
  ];
  const shoulders: IAutoMovieViewSectionField.IStationJet[] = [
    [0.5, 0.1, -0.1],
    [0.4, 0.1, -0.1],
    [0.3, 0.1, -0.1],
    [0.2, 0.1, -0.1],
  ];
  const native: IAutoMovieLoftSectionSourceFamily = {
    kind: "native",
    inputs: { extents, shoulders },
  };
  for (const family of [basis, native]) {
    const sectionSource = AutoMovieEngineLoftSectionSource.bind(layer, family);
    TestValidator.equals(
      "bound finite endpoint family",
      AutoMovieEngineLoftSectionSource.endpoint({ ...layer, sectionSource }, 2)!
        .field,
      family,
    );
    TestValidator.predicate(
      "field and snapshot are independent copies",
      sectionSource.field !== family &&
        sectionSource.snapshot !== sectionSource.field,
    );
  }

  for (const family of [
    {
      ...basis,
      order: 1.5,
      rows: [
        [1, 2, 3],
        [3, 4, 5],
        [5, 6, 7],
      ],
    },
    {
      ...basis,
      rows: [
        [Infinity, 2],
        [3, 4],
        [5, 6],
      ],
    },
    {
      ...basis,
      rows: [
        [1, 2],
        [3, NaN],
        [5, 6],
      ],
    },
    { ...native, inputs: { extents: [[8], ...extents.slice(1)], shoulders } },
    {
      ...native,
      inputs: {
        extents,
        shoulders: [[0.5, 0, Infinity], ...shoulders.slice(1)],
      },
    },
  ] as unknown as IAutoMovieLoftSectionSourceFamily[])
    TestValidator.predicate(
      "invalid endpoint data of family " + family.kind + " is rejected",
      throwsError(
        () => AutoMovieEngineLoftSectionSource.bind(layer, family),
        "actual complete generating family",
      ),
    );

  for (const modified of [
    { ...layer, y: Infinity },
    { ...layer, coefficients: [1, Infinity] },
    { ...layer, slopes: [3, Infinity] },
    { ...layer, curvatures: [5, Infinity] },
  ]) {
    const sectionSource = AutoMovieEngineLoftSectionSource.bind(
      modified,
      basis,
    );
    TestValidator.predicate(
      "matching nonfinite compatibility snapshots do not validate",
      throwsError(
        () =>
          AutoMovieEngineLoftSectionSource.endpoint(
            { ...modified, sectionSource },
            2,
          ),
        "stale or malformed",
      ),
    );
  }

  const curves: IAutoMovieViewConic.ICurve[] = [8, 12].map((radius) => {
    const shoulder: number = Math.SQRT2 - 1;
    const curvature: number = AutoMovieEngineConicArc.curvature(
      radius,
      radius,
      shoulder,
    );
    return AutoMovieEngineViewConic.create(
      new Array<number>(4).fill(radius),
      new Array<number>(4).fill(shoulder),
      new Array<number>(4).fill(curvature),
    );
  });
  const prepared = AutoMovieEngineLoftPhaseSource.prepare([0, 1], curves);
  if (typeof prepared === "string") throw new Error(prepared);
  const station = AutoMovieEngineLoftPhaseSource.station(
    prepared,
    0.5,
    [0.5, 2],
  );
  TestValidator.equals(
    "linear cardinal weights after a station reparameterization",
    station.weights,
    [
      [0.5, 0.5],
      [-0.5, 0.5],
      [-2, 2],
    ],
  );
  TestValidator.equals(
    "the midpoint of radius 8 and 12 at phase zero",
    AutoMovieEngineLoftPhaseSource.point(station, 0),
    [10, 0],
  );

  for (const coordinates of [
    [Number.MAX_VALUE, Infinity],
    [-Number.MAX_VALUE, Number.MAX_VALUE],
    [0, Number.MIN_VALUE],
  ])
    TestValidator.predicate(
      "source refuses impossible physical cardinal data for " + coordinates,
      typeof AutoMovieEngineLoftPhaseSource.prepare(coordinates, curves) ===
        "string",
    );

  const brokenCurve: IAutoMovieViewConic.ICurve = {
    ...curves[0]!,
    quarters: curves[0]!.quarters.map((quarter, index) =>
      index === 0 ? { ...quarter, extents: [Infinity, 8] } : quarter,
    ),
  };
  TestValidator.predicate(
    "source refuses an infinite positive half extent",
    AutoMovieEngineLoftPhaseSource.prepare(
      [0, 1],
      [brokenCurve, curves[1]!],
    ) === "native phase source has malformed quarter data",
  );

  for (const [q, change, reason] of [
    [NaN, undefined, "finite in-domain coordinate"],
    [0.5, [NaN, 0], "finite in-domain coordinate"],
    [0.5, [1, Infinity], "finite in-domain coordinate"],
  ] as const)
    TestValidator.predicate(
      "station refuses " + q + " with change " + change,
      throwsError(
        () => AutoMovieEngineLoftPhaseSource.station(prepared, q, change),
        reason,
      ),
    );

  const steep = AutoMovieEngineLoftPhaseSource.prepare([0, 0.5], curves);
  if (typeof steep === "string") throw new Error(steep);
  TestValidator.predicate(
    "finite change coefficients can still overflow the interpolation weights",
    throwsError(
      () =>
        AutoMovieEngineLoftPhaseSource.station(steep, 0.25, [
          Number.MAX_VALUE,
          0,
        ]),
      "finite interpolation weights",
    ),
  );
}
