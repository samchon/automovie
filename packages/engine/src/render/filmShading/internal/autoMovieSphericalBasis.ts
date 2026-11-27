/*
 * The nine real spherical harmonics of bands 0 to 2 at a unit direction, in the
 * band order of `IAutoMovieIrradianceProbe`: 0.282095; 0.488603 y, z, x;
 * 1.092548 xy, 1.092548 yz, 0.315392 (3z² − 1), 1.092548 xz, 0.546274 (x² −
 * y²). The constants are the normalizations `sqrt((2l + 1) / 4π × (l − |m|)! /
 * (l + |m|)!)`, with √2 for m ≠ 0, as tabulated by Ramamoorthi and Hanrahan
 * 2001; the renderer's GLSL uses the same nine products.
 * Returns: Nine basis values.
 */
export function autoMovieSphericalBasis(
  x: number,
  y: number,
  z: number,
): number[] {
  return [
    0.282095,
    0.488603 * y,
    0.488603 * z,
    0.488603 * x,
    1.092548 * x * y,
    1.092548 * y * z,
    0.315392 * (3 * z * z - 1),
    1.092548 * x * z,
    0.546274 * (x * x - y * y),
  ];
}
