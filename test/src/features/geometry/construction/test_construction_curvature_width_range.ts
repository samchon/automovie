import {
  AutoMovieConstructionWidths,
  AutoMovieSolidIntersection,
} from "@automovie/engine";
import type {
  IAutoMovieConstructionWidths,
  IAutoMovieSolidIntersection,
  IAutoMovieSolidJoin,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

/**
 * Adjacent short rail samples around a face edge retain finite positive widths.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the actual curvature width law with four known selected-chart stations, including two consecutive whose end distance limits their widths to 0.01 mm.
 * @evidence contracts/development/testing.md#independent-expectations The planar 2-jet has zero bend and the stated end share gives 7, 0.01, 0.01 and 7 mm before any interpolation.
 * @evidence contracts/development/testing.md#distinguishing-cases Compares every source sample, the intersample valley and closure over one turn. A natural cubic can become negative between the two short samples.
 * @evidence contracts/development/testing.md#execution-ownership Uses a made borrowed trace and planar source without mesh or a person.
 * @evidence contracts/development/common.md#meaningful-documentation Documents how the independent chart stations determine their cap.
 */
export function test_construction_curvature_width_range(): void {
  const surface: IAutoMovieSolidSurface = {
    name: "planar-width-source",
    orientation: 1,
    domain: [0, 100],
    jet: (u: number, v: number): IAutoMovieSolidSurface.IJet => ({
      p: [u, v, 0],
      u: [1, 0, 0],
      v: [0, 1, 0],
      uu: [0, 0, 0],
      uv: [0, 0, 0],
      vv: [0, 0, 0],
    }),
  };
  const step: number = Math.PI / 2;
  const stations: number[] = [14, 0.02, 0.02, 14];
  const points: IAutoMovieSolidIntersection.IPoint[] = stations.map(
    (station: number, i: number): IAutoMovieSolidIntersection.IPoint => ({
      t: i * step,
      s: station,
      phi: 0,
      face: 0,
      y: station,
      theta: 0,
      point: [station, 0, 0],
      tangent: [0, 1, 0],
      second: [0, 0, 0],
      rate: [0, 1, 0, 1],
      rate2: [0, 0, 0, 0],
      angle: Math.PI / 2,
    }),
  );
  const traced: IAutoMovieConstructionWidths.ITraced = {
    part: surface,
    host: AutoMovieSolidIntersection.atlas(surface),
    diff: false,
    curve: {
      part: "part",
      host: "host",
      parameter: { kind: "phase" },
      points,
      winding: 0,
      partWinding: 0,
      at: (t: number): IAutoMovieSolidIntersection.IPoint | null =>
        points.find((point): boolean => point.t === t) ?? null,
    },
  };
  const width: IAutoMovieSolidJoin.IInput["width"] | string =
    AutoMovieConstructionWidths.create(
      { type: "chord", value: 0.002 },
      { type: "curvature", share: 0.5, cap: 0.01, end: 0.5 },
      true,
      traced,
    );
  if (typeof width === "string") throw new Error(width);
  for (const [i, station] of stations.entries()) {
    const got: number = width.host(i * step);
    if (Math.abs(got - station / 2) > 1e-12)
      throw new Error(`The rail law changes sample ${i}: ${got}`);
  }
  const valley: number = width.host((3 * Math.PI) / 4);
  if (!(valley >= 0.01))
    throw new Error(`Adjacent positive rails produce a negative width: ${valley}`);
  for (let i: number = 0; i <= 64; i++) {
    const t: number = (2 * Math.PI * i) / 64;
    const chord: number = width.host(t);
    if (!(chord >= 0.01 && chord <= 7))
      throw new Error(`The rail law leaves its sampled range at ${t}: ${chord}`);
  }
}
