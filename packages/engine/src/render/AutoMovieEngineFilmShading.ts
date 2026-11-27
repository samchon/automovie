import { type IAutoMovieIrradianceVolume, type IAutoMovieFilmShading, type IAutoMovieIrradianceProbe, type IAutoMovieVector3, type IAutoMovieProjectIrradianceProbe, type IAutoMovieSampleIrradianceVolume } from "@automovie/interface";
import { autoMovieIrradianceGrid as autoMovieIrradianceGridImplementation } from "./filmShading/internal/autoMovieIrradianceGrid";
import { autoMovieIrradianceOf as autoMovieIrradianceOfImplementation } from "./filmShading/internal/autoMovieIrradianceOf";
import { autoMovieSliceVisibility as autoMovieSliceVisibilityImplementation } from "./filmShading/internal/autoMovieSliceVisibility";
import { autoMovieSphericalBasis as autoMovieSphericalBasisImplementation } from "./filmShading/internal/autoMovieSphericalBasis";
import { projectAutoMovieIrradianceProbe as projectAutoMovieIrradianceProbeImplementation } from "./filmShading/internal/projectAutoMovieIrradianceProbe";
import { sampleAutoMovieIrradianceVolume as sampleAutoMovieIrradianceVolumeImplementation } from "./filmShading/internal/sampleAutoMovieIrradianceVolume";

/** Public operations for Auto Movie Engine Film Shading. */
export namespace AutoMovieEngineFilmShading {
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
  export function autoMovieIrradianceGrid(probes: IAutoMovieFilmShading.IProbes): Omit<IAutoMovieIrradianceVolume, "probes"> & {
  positions: [number, number, number][];
} {
    return autoMovieIrradianceGridImplementation(probes);
  }

  /**
   * The irradiance in lux, per RGB channel, that a probe's coefficients give a
   * receiver facing a world direction: `Σ c_lm Y_lm(n)` over the nine bands.
   *
   * The order-2 series can dip slightly below zero for a receiver facing away
   * from a bright half-space; the value is returned as computed, as the
   * renderer's shader computes it.
   *
   * @param probe The baked probe.
   * @param normal The receiver's direction; normalized here, so any finite
   *   nonzero length works.
   * @returns `[r, g, b]` irradiance in lux.
   */
  export function autoMovieIrradianceOf(probe: Pick<IAutoMovieIrradianceProbe, "coefficients">, normal: IAutoMovieVector3): [number, number, number] {
    return autoMovieIrradianceOfImplementation(probe, normal);
  }

  /**
   * The cosine-weighted visibility one screen-space slice contributes to a
   * point's ground-truth-based ambient occlusion: the closed-form inner integral
   * of Jimenez, Wu, Pesce and Jarabo 2016 ("Practical real-time strategies for
   * accurate indirect occlusion", SIGGRAPH course "Physically Based Shading in
   * Theory and Practice", equation 10), the CPU reference of the renderer's
   * occlusion pass.
   *
   * A slice is the plane through the view direction and one screen direction.
   * Angles are measured in that plane from the view direction toward the screen
   * direction: `normal` is the angle of the surface normal projected into the
   * slice, and `low` and `high` the angles of the highest occluder on the
   * negative and positive side. Each horizon is first clamped to the hemisphere
   * about the normal, `normal ± π / 2`, and the slice then contributes `length ×
   * Σ (cos n + 2 h sin n − cos(2h − n)) / 4` over its two horizons, with `length`
   * the projected normal's length. Averaged over slices spread uniformly over the
   * half turn, the contributions estimate the cosine-weighted visible fraction of
   * the hemisphere: 1 for an open surface facing the view.
   *
   * @param normal Projected normal angle `n` in radians, within [-π/2, π/2].
   * @param length Length of the normal projected into the slice, within [0, 1].
   * @param low Horizon angle `h0` on the negative side, radians, at most `n`.
   * @param high Horizon angle `h1` on the positive side, radians, at least `n`.
   * @returns The slice's visibility.
   */
  export function autoMovieSliceVisibility(normal: number, length: number, low: number, high: number): number {
    return autoMovieSliceVisibilityImplementation(normal, length, low, high);
  }

  /**
   * The nine real spherical harmonics of bands 0 to 2 at a unit direction, in the
   * band order of `IAutoMovieIrradianceProbe`: 0.282095; 0.488603 y, z, x;
   * 1.092548 xy, 1.092548 yz, 0.315392 (3z² − 1), 1.092548 xz, 0.546274 (x² −
   * y²). The constants are the normalizations `sqrt((2l + 1) / 4π × (l − |m|)! /
   * (l + |m|)!)`, with √2 for m ≠ 0, as tabulated by Ramamoorthi and Hanrahan
   * 2001; the renderer's GLSL uses the same nine products.
   *
   * @returns Nine basis values.
   */
  export function autoMovieSphericalBasis(x: number, y: number, z: number): number[] {
    return autoMovieSphericalBasisImplementation(x, y, z);
  }

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
  export function projectAutoMovieIrradianceProbe(props: IAutoMovieProjectIrradianceProbe.IProps): IAutoMovieIrradianceProbe {
    return projectAutoMovieIrradianceProbeImplementation(props);
  }

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
  export function sampleAutoMovieIrradianceVolume(props: IAutoMovieSampleIrradianceVolume.IProps): [number, number, number] {
    return sampleAutoMovieIrradianceVolumeImplementation(props);
  }
}
