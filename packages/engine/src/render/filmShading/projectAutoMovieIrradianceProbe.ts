import type {
  IAutoMovieIrradianceProbe,
  IAutoMovieProjectIrradianceProbe,
} from "@automovie/interface";

import { autoMovieSphericalBasis } from "./autoMovieSphericalBasis";

/**
 * Cosine-lobe convolution of bands 0, 1 and 2: π, 2π/3 and π/4 (Ramamoorthi and
 * Hanrahan 2001, equation 8).
 */
const LOBE: readonly number[] = [
  Math.PI,
  (2 * Math.PI) / 3,
  (2 * Math.PI) / 3,
  (2 * Math.PI) / 3,
  Math.PI / 4,
  Math.PI / 4,
  Math.PI / 4,
  Math.PI / 4,
  Math.PI / 4,
];

/**
 * Bake one irradiance probe from its cube: project the radiance the six faces
 * saw onto order-2 spherical harmonics and convolve them with the clamped
 * cosine, so `autoMovieIrradianceOf` gives the irradiance in lux of a receiver
 * at the probe facing any direction (Ramamoorthi and Hanrahan 2001, "An
 * efficient representation for irradiance environment maps", SIGGRAPH).
 *
 * Each texel contributes its radiance times the basis at its direction times
 * its exact solid angle, `A(x0, y0) − A(x0, y1) − A(x1, y0) + A(x1, y1)` with
 * `A(x, y) = atan2(xy, sqrt(x² + y² + 1))` over its corners on the
 * unit-distance face plane, so the six faces together integrate over exactly
 * 4π. The radiance-to-irradiance step multiplies band l by π, 2π/3 or π/4.
 * Order-2 harmonics capture irradiance to within about 1 % of its energy for
 * most environments (Ramamoorthi and Hanrahan's bound for a clamped cosine is
 * under 3 %), and a sharp half-space boundary such as a floor's horizon reaches
 * about 10 % at worst.
 *
 * The probe is invalid when more than a quarter of all texels see back faces,
 * because it then sits inside a solid and sees the inside of a closed shell.
 *
 * @throws When `size` is not a positive safe integer, there are not six faces,
 *   or a face's arrays are shorter than `size²` texels.
 */
export function projectAutoMovieIrradianceProbe(
  props: IAutoMovieProjectIrradianceProbe.IProps,
): IAutoMovieIrradianceProbe {
  const { size, faces }: IAutoMovieProjectIrradianceProbe.IProps = props;
  if (!Number.isSafeInteger(size) || size < 1)
    throw new Error("irradiance probe size must be a positive safe integer");
  if (faces.length !== 6)
    throw new Error("an irradiance probe needs six cube faces");
  const coefficients: number[] = new Array<number>(27).fill(0);
  let back: number = 0;
  const area: (x: number, y: number) => number = (
    x: number,
    y: number,
  ): number => Math.atan2(x * y, Math.sqrt(x * x + y * y + 1));
  for (const face of faces) {
    if (
      face.radiance.length < 4 * size * size ||
      face.backFaces.length < size * size
    )
      throw new Error("an irradiance probe face is shorter than its size");
    for (let j: number = 0; j < size; ++j)
      for (let i: number = 0; i < size; ++i) {
        const texel: number = j * size + i;
        if (face.backFaces[texel] !== 0) ++back;
        const x0: number = (i / size) * 2 - 1;
        const x1: number = ((i + 1) / size) * 2 - 1;
        const y0: number = (j / size) * 2 - 1;
        const y1: number = ((j + 1) / size) * 2 - 1;
        const solid: number =
          area(x0, y0) - area(x0, y1) - area(x1, y0) + area(x1, y1);
        const s: number = (x0 + x1) / 2;
        const t: number = (y0 + y1) / 2;
        const dx: number = face.forward.x + s * face.right.x + t * face.up.x;
        const dy: number = face.forward.y + s * face.right.y + t * face.up.y;
        const dz: number = face.forward.z + s * face.right.z + t * face.up.z;
        const length: number = Math.hypot(dx, dy, dz);
        const basis: number[] = autoMovieSphericalBasis(
          dx / length,
          dy / length,
          dz / length,
        );
        for (let k: number = 0; k < 9; ++k) {
          const weight: number = basis[k]! * solid;
          coefficients[3 * k] += face.radiance[4 * texel]! * weight;
          coefficients[3 * k + 1] += face.radiance[4 * texel + 1]! * weight;
          coefficients[3 * k + 2] += face.radiance[4 * texel + 2]! * weight;
        }
      }
  }
  return {
    coefficients: coefficients.map(
      (value: number, index: number): number =>
        value * LOBE[Math.floor(index / 3)]!,
    ),
    valid: back <= 0.25 * 6 * size * size,
  };
}
