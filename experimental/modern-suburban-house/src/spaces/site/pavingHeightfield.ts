import type { IAutoMovieHeightRule } from "@automovie/interface";

/** The bilinear rule sampled from the same height callback as the paving mesh.
 */

export const pavingHeightfield = (
  x: readonly [number, number],
  z: readonly [number, number],
  height: (x: number, z: number) => number
): IAutoMovieHeightRule => ({
  kind: "heightfield",
  originX: x[0],
  originZ: z[0],
  spacingX: x[1] - x[0],
  spacingZ: z[1] - z[0],
  columns: 2,
  rows: 2,
  samples: [
    height(x[0], z[0]),
    height(x[1], z[0]),
    height(x[0], z[1]),
    height(x[1], z[1]),
  ],
});
