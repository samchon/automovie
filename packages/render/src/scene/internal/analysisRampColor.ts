import type { IAutoMovieColor } from "@automovie/interface";

/*
 * Map a normalized `[0, 1]` position on the ramp to a colour.
 *
 * A three-stop blue-green-red ramp, interpolated linearly in each channel. It
 * returns RGB channel values without allocating a texture. The caller owns the
 * renderer's subsequent color-space conversion. Finite values outside the unit
 * interval clamp to the nearest endpoint; NaN propagates rather than becoming a
 * valid color.
 */
export const analysisRampColor: (
  position: number,
) => Pick<IAutoMovieColor, "r" | "g" | "b"> = (
  position: number,
): Pick<IAutoMovieColor, "r" | "g" | "b"> => {
  const t: number = Math.min(1, Math.max(0, position));
  if (t <= 0.5) {
    const local: number = t * 2;
    return { r: 0, g: local, b: 1 - local };
  }
  const local: number = (t - 0.5) * 2;
  return { r: local, g: 1 - local, b: 0 };
};
