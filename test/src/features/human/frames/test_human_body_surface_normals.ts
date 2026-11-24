import { AutoMovieLoftJet, AutoMovieViewLoft } from "@automovie/engine";
import {
  AutoMovieHumanBodySurfaceNormals,
  AutoMovieHumanConicLoft,
  AutoMovieHumanConicSection,
} from "@automovie/human";
import type {
  IAutoMovieHumanBodyCalibration,
  IAutoMovieHumanConicLoft,
  IAutoMovieLoftChain,
  IAutoMovieLoftSectionSourceBinding,
} from "@automovie/interface";

/**
 * Surface shading prepares immutable original bindings over chart input runs.
 *
 * Scenarios:
 *
 * 1. Read 60 rings of 180 phases on a straight native circle. Check every
 *    component against the original analytic query and count each retained
 *    compatibility row's value inspection.
 * 2. Check opposite orientation, a normal outside the angle gate and a vertex
 *    without a chart.
 * 3. A stale binding in the queried bracket refuses; one in an unrelated bracket
 *    stays outside the request's refusal scope.
 * 4. The same circle with no carried frame curvatures uses its physical station
 *    difference and produces the same radial direction.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Uses the production loft and Human shading entries. Inspects accessors on owned immutable section bindings without intercepting a product function.
 * @evidence contracts/development/testing.md#independent-expectations The analytic unit circle normal has cosine and sine components. The direct loft jet also verifies exact arithmetic compatibility with the previous single-point shading input.
 * @evidence contracts/development/testing.md#distinguishing-cases Opposite normals, rejected mesh directions, missing chart coordinates and an edited retained row exercise both output and actual owner admission.
 * @evidence contracts/development/testing.md#execution-ownership Runs one analytic conic family in memory, without files, host timing assertions or whole-body generation.
 * @evidence contracts/development/common.md#meaningful-documentation Names the fixture's chart and the expected binding and shading outcomes.
 */
export function test_human_body_surface_normals(): void {
  const knots: number[] = [0, 12, 24, 48];
  const r: number = 3;
  const full: number = Math.SQRT2 - 1;
  const family: IAutoMovieHumanConicLoft.IFamily = {
    name: "normal-cylinder",
    centres: [
      [0, 0, 0],
      [0, 48, 0],
    ],
    halves: [],
    up: [1, 0, 0],
    knots,
    layout: AutoMovieHumanConicSection.limb(0),
    values: [r, 0, 0, r, -r, 0, 0, -r, full, full, full, full].map(
      (value: number): number[] => knots.map((): number => value),
    ),
  };
  const chain: IAutoMovieLoftChain | null = AutoMovieViewLoft.create(
    AutoMovieHumanConicLoft.part(family, knots),
  ).chain;
  if (chain?.nativeSource === undefined || !AutoMovieLoftJet.carries(chain))
    throw new Error("The native circle has no admitted original jets.");

  const failures: string[] = [];
  const calibration: IAutoMovieHumanBodyCalibration = {
    stature: 48,
    chains: [chain],
    events: [],
    poles: [],
    apertures: [],
    eyes: [],
  };
  const coordinates: number[] = [];
  const mesh: number[] = [];
  const expected: number[] = [];
  for (let row: number = 0; row < 60; row++) {
    const station: number = (48 * row) / 59;
    for (let column: number = 0; column < 180; column++) {
      const phase: number = (2 * Math.PI * column) / 180;
      const sign: number = column % 2 === 0 ? 1 : -1;
      const xy: readonly [number, number, number] = AutoMovieLoftJet.normal(
        AutoMovieLoftJet.at(chain, station, phase),
      )!;
      const c: number = Math.cos(phase);
      const s: number = Math.sin(phase);
      if (
        row === 0 &&
        Math.min(
          Math.hypot(xy[0] - c, xy[1], xy[2] - s),
          Math.hypot(xy[0] + c, xy[1], xy[2] + s),
        ) > 1e-11
      )
        failures.push(`The analytic section normal disagrees at ${column}.`);
      coordinates.push(0, station, phase);
      mesh.push(sign * xy[0], 0.125, sign * xy[2]);
      expected.push(sign * xy[0], sign * xy[1], sign * xy[2]);
    }
  }
  coordinates.push(0, 9, Math.PI / 2, NaN, 0, 0);
  mesh.push(0, 1, 0, 0, 0, 1);
  expected.push(0, 1, 0, 0, 0, 1);

  let reads: number = 0;
  for (const binding of chain.nativeSource.rows) {
    const snapshot: IAutoMovieLoftSectionSourceBinding["value"] = binding.value;
    Object.defineProperty(binding, "value", {
      get(): IAutoMovieLoftSectionSourceBinding["value"] {
        reads++;
        return snapshot;
      },
    });
  }
  const actual: number[] = AutoMovieHumanBodySurfaceNormals.surfaceNormals(
    calibration,
    coordinates,
    mesh,
  );
  if (
    actual.some(
      (value: number, k: number): boolean => !Object.is(value, expected[k]),
    )
  )
    failures.push("The prepared normal differs from the previous exact query.");
  if (reads !== chain.nativeSource.rows.length)
    failures.push(
      `Read ${reads} retained values for ${chain.nativeSource.rows.length} rows.`,
    );

  const first: IAutoMovieLoftSectionSourceBinding = chain.nativeSource.rows[0]!;
  const shifted: number[] = [...first.value];
  shifted[0]! += 1;
  const stale: IAutoMovieLoftChain = {
    ...chain,
    nativeSource: {
      ...chain.nativeSource,
      rows: [{ ...first, value: shifted }, ...chain.nativeSource.rows.slice(1)],
    },
  };
  const measure = (station: number): number[] =>
    AutoMovieHumanBodySurfaceNormals.surfaceNormals(
      { ...calibration, chains: [stale] },
      [0, station, 0],
      [1, 0, 0],
    );
  if (!measure(30).every(Number.isFinite))
    failures.push("A stale early binding refused an unrelated station.");
  try {
    measure(6);
    failures.push("A stale binding in the queried bracket was accepted.");
  } catch (error: unknown) {
    if (
      !(error instanceof Error && error.message.includes("compatibility rows"))
    )
      throw error;
  }
  const noFrameCurvature: IAutoMovieLoftChain = {
    ...chain,
    layers: chain.layers.map(
      (layer: IAutoMovieLoftChain.ILayer): IAutoMovieLoftChain.ILayer => ({
        ...layer,
        frameCurvatures: undefined,
        frameSource: undefined,
      }),
    ),
  };
  const fallback: number[] = AutoMovieHumanBodySurfaceNormals.surfaceNormals(
    { ...calibration, chains: [noFrameCurvature] },
    [0, 0, 0, 0, 0, Math.PI / 2],
    [1, 0.1, 0, 0, 0.1, 1],
  );
  if (
    fallback.some(
      (value: number, i: number): boolean =>
        Math.abs(value - [1, 0, 0, 0, 0, 1][i]!) > 1e-11,
    )
  )
    failures.push(
      "The one-sided station difference lost its radial direction.",
    );
  if (failures.length > 0) throw new Error(failures.join("\n"));
}
