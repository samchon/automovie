import type {
  IAutoMovieIrradianceProbe,
  IAutoMovieSampleIrradianceVolume,
} from "@automovie/interface";

import { autoMovieIrradianceOf } from "./autoMovieIrradianceOf";

/**
 * The irradiance a receiver gets from a baked probe grid: trilinear
 * interpolation over the eight probes around the point, with the weights of
 * invalid probes dropped and the rest renormalized to sum to one (Greger,
 * Shirley, Hubbard and Greenberg 1998, "The irradiance volume"); the CPU
 * reference of the lit materials' probe term.
 *
 * The point's grid coordinate `(point − min) / spacing` is clamped to the grid
 * on each axis, so a point outside the box takes the probes of the nearest face
 * (or edge, or corner). With no valid probe among the eight the result is
 * zero.
 *
 * @returns `[r, g, b]` irradiance in lux.
 */
export function sampleAutoMovieIrradianceVolume(
  props: IAutoMovieSampleIrradianceVolume.IProps,
): [number, number, number] {
  const { volume, point, normal }: IAutoMovieSampleIrradianceVolume.IProps =
    props;
  const axis: (
    value: number,
    origin: number,
    count: number,
  ) => [number, number, number] = (
    value: number,
    origin: number,
    count: number,
  ): [number, number, number] => {
    const g: number = Math.max(
      0,
      Math.min(count - 1, (value - origin) / volume.spacing),
    );
    const low: number = Math.min(Math.floor(g), Math.max(count - 2, 0));
    return [low, Math.min(low + 1, count - 1), g - low];
  };
  const [x0, x1, fx]: [number, number, number] = axis(
    point.x,
    volume.min.x,
    volume.counts.x,
  );
  const [y0, y1, fy]: [number, number, number] = axis(
    point.y,
    volume.min.y,
    volume.counts.y,
  );
  const [z0, z1, fz]: [number, number, number] = axis(
    point.z,
    volume.min.z,
    volume.counts.z,
  );
  const sum: [number, number, number] = [0, 0, 0];
  let total: number = 0;
  for (const [i, wx] of [
    [x0, 1 - fx],
    [x1, fx],
  ] as const)
    for (const [j, wy] of [
      [y0, 1 - fy],
      [y1, fy],
    ] as const)
      for (const [k, wz] of [
        [z0, 1 - fz],
        [z1, fz],
      ] as const) {
        const weight: number = wx * wy * wz;
        const probe: IAutoMovieIrradianceProbe | undefined =
          volume.probes[i + volume.counts.x * (j + volume.counts.y * k)];
        if (weight === 0 || probe === undefined || !probe.valid) continue;
        const e: [number, number, number] = autoMovieIrradianceOf(
          probe,
          normal,
        );
        sum[0] += weight * e[0];
        sum[1] += weight * e[1];
        sum[2] += weight * e[2];
        total += weight;
      }
  return total === 0
    ? [0, 0, 0]
    : [sum[0] / total, sum[1] / total, sum[2] / total];
}
