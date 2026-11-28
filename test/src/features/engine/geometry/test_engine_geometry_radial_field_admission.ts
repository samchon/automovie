import { AutoMovieEngineGeometry } from "@automovie/engine";
import type { IAutoMovieIntegrateRadialField } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * A compact radial field integrates the declared polynomial and physical
 * gradient over dense finite geometry.
 *
 * Centred squares exercise both polynomial degrees and duplicate and distant
 * site ownership. A half disk keeps the same normalized integral and gradient
 * at ordinary, tiny and huge unit scales. Invalid power, nonfinite or sparse
 * inputs, unrepresentable radius and overflowing partition arithmetic throw.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the two powers, symmetric and clipped support, scale controls and domain and arithmetic refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public Geometry.integrateRadialField with typed sites and polygons. Reads the integral, physical gradient and area in each scale and checks explicit invalid-input diagnoses.
 * @evidence contracts/development/testing.md#independent-expectations Centred unit-square moments of squared distance are 1/6, 7/180 and 3/280, giving 127/180 and 509/840 for powers 2 and 3. A unit half disk has integral pi/6 and physical X gradient -16/15 from the straight diameter. Scaling by a radius multiplies these by squared and linear factors respectively.
 */
export function test_engine_geometry_radial_field_admission(): void {
  const integrate = AutoMovieEngineGeometry.integrateRadialField;
  const site: IAutoMovieIntegrateRadialField.ISite = { x: 0.5, y: 0.5, z: 0 };
  const square: IAutoMovieIntegrateRadialField.IProps = {
    polygon: [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ],
    sites: [site],
    radius: 1,
    power: 2,
  };
  const squared = integrate(square);
  const cubed = integrate({ ...square, power: 3 });
  TestValidator.predicate(
    "independent polynomial moments",
    Math.abs(squared.integral - 127 / 180) <= 1e-12 &&
      Math.abs(cubed.integral - 509 / 840) <= 1e-12 &&
      [squared, cubed].every(
        ({ area, gradient }) =>
          area === 1 &&
          gradient.every((component) => Math.abs(component) <= 1e-12),
      ),
  );
  TestValidator.equals(
    "clockwise footprint and inactive or duplicate sites",
    integrate({
      ...square,
      polygon: [...square.polygon].reverse(),
      sites: [site, { ...site }, { ...site, z: 1e200 }],
    }),
    squared,
  );
  TestValidator.equals(
    "empty field over finite area",
    integrate({ ...square, sites: [] }),
    {
      integral: 0,
      gradient: [0, 0],
      area: 1,
    },
  );

  for (const r of [1, 1e-90, 1e100]) {
    const half = integrate({
      polygon: [
        [0, -2 * r],
        [2 * r, -2 * r],
        [2 * r, 2 * r],
        [0, 2 * r],
      ],
      sites: [{ x: 0, y: 0, z: 0 }],
      radius: r,
      power: 2,
    });
    TestValidator.predicate(
      "scale-invariant radius-normalized half disk",
      Math.abs(half.integral / (r * r) - Math.PI / 6) <= 1e-12 &&
        Math.abs(half.gradient[0] / r + 16 / 15) <= 1e-12 &&
        Math.abs(half.gradient[1] / r) <= 1e-12 &&
        Math.abs(half.area / (r * r) - 8) <= 1e-12,
    );
  }

  const invalid: [string, IAutoMovieIntegrateRadialField.IProps, string][] = [
    [
      "unrecognized power",
      { ...square, power: 4 as unknown as 3 },
      "power must be 2 or 3",
    ],
    ["NaN radius", { ...square, radius: NaN }, "positive radius"],
    [
      "squared radius underflow",
      { ...square, radius: Number.MIN_VALUE },
      "squared-coordinate range",
    ],
    [
      "squared radius overflow",
      { ...square, radius: 1e200 },
      "squared-coordinate range",
    ],
    [
      "NaN site",
      { ...square, sites: [{ ...site, x: NaN }] },
      "finite site centres",
    ],
    [
      "sparse site list",
      { ...square, sites: new Array(1) },
      "finite site centres",
    ],
    [
      "nonfinite polygon",
      { ...square, polygon: [[NaN, 0]] },
      "finite planar points",
    ],
    [
      "sparse polygon",
      { ...square, polygon: new Array(1) },
      "finite planar points",
    ],
    [
      "site clipping overflow",
      {
        ...square,
        polygon: [
          [-1e300, -1],
          [1e300, -1],
          [1e300, 1],
          [-1e300, 1],
        ],
        sites: [
          { x: -1e120, y: 0, z: 0 },
          { x: 1e120, y: 0, z: 0 },
        ],
      },
      "site clipping exceeds finite arithmetic",
    ],
  ];
  TestValidator.equals(
    "invalid field domain and arithmetic",
    invalid
      .filter(
        ([, input, message]) => !throwsError(() => integrate(input), message),
      )
      .map(([name]) => name),
    [],
  );
}
