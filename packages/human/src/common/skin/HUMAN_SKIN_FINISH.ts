import type { IAutoMovieHumanSkinFinish } from "./IAutoMovieHumanSkinFinish";

/**
 * Source-owned skin finish consumed by the body builder and reusable by other builders.
 *
 * Jensen, Marschner, Levoy and Hanrahan (SIGGRAPH 2001), Figure 5(b),
 * report fitted skin1 reduced scattering (0.74, 0.88, 1.01) and absorption
 * (0.032, 0.17, 0.48), both inverse millimetres. Their diffusion model gives
 * 1 / sqrt(3 * sigmaA * (sigmaA + sigmaSPrime)), rounded here to red 3.67,
 * green 1.37 and blue 0.68 mm, then converted to metres. These distances
 * are derived from the fitted coefficients, not directly measured paths.
 * The paper describes arm-skin acquisition; this record applies its RGB
 * values to face and body sites as an authored appearance approximation.
 * It supplies no site-specific or demographic calibration; the skin1 donor
 * population and sample count are unspecified here. RGB channels are used
 * as renderer primaries rather than a measured spectral-to-sRGB conversion.
 * Source: https://graphics.stanford.edu/papers/bssrdf/bssrdf.pdf
 *
 * `material` identifies the skin material receiving this finish. Another
 * builder can apply the same record to agree on scattering at a shared join.
 */
export const HUMAN_SKIN_FINISH: IAutoMovieHumanSkinFinish = {
  material: "skin",
  scattering: { r: 0.00367, g: 0.00137, b: 0.00068 },
};
