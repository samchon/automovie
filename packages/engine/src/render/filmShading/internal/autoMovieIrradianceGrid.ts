import type {
  IAutoMovieFilmShading,
  IAutoMovieIrradianceVolume,
} from "@automovie/interface";

/**
 * The probe grid a film's `probes` box asks for: probes from `min` at
 * `spacing`, `floor((max − min) / spacing + 1e-9) + 1` along each axis, so a
 * box whose sides are whole multiples of the spacing has probes on both faces
 * despite rounding.
 *
 * @param probes The admitted probes request.
 * @returns The grid's origin, pitch and counts, and every probe position in the
 *   volume's order (X fastest, then Y, then Z), world metres.
 */
export function autoMovieIrradianceGrid(
  probes: IAutoMovieFilmShading.IProbes,
): Omit<IAutoMovieIrradianceVolume, "probes"> & {
  positions: [number, number, number][];
} {
  const count: (low: number, high: number) => number = (
    low: number,
    high: number,
  ): number => Math.floor((high - low) / probes.spacing + 1e-9) + 1;
  const counts: IAutoMovieIrradianceVolume["counts"] = {
    x: count(probes.min.x, probes.max.x),
    y: count(probes.min.y, probes.max.y),
    z: count(probes.min.z, probes.max.z),
  };
  const positions: [number, number, number][] = [];
  for (let k: number = 0; k < counts.z; ++k)
    for (let j: number = 0; j < counts.y; ++j)
      for (let i: number = 0; i < counts.x; ++i)
        positions.push([
          probes.min.x + i * probes.spacing,
          probes.min.y + j * probes.spacing,
          probes.min.z + k * probes.spacing,
        ]);
  return { min: { ...probes.min }, spacing: probes.spacing, counts, positions };
}
