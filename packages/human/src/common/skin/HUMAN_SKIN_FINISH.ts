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
 *
 * @evidence contracts/common.md#principled-implementation One source-owned record supplies the body finish and lets another builder reuse the same authority rather than duplicate values that can drift.
 * @evidence contracts/common.md#clear-and-simple-design One constant; no per-site table until a per-site measurement exists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The shared renderer radius derives from published fitted optical coefficients; applying it to all sites is an explicit authored approximation.
 * @evidence contracts/common.md#meaningful-documentation States the coefficient fit, diffusion derivation, rounding, metre conversion and uncalibrated site and population extension.
 * @evidence contracts/modeling.md#shared-boundaries Builders that apply this same record can give both sides of a skin join the same scattering; the body builder consumes it here.
 * @evidence contracts/modeling.md#spatial-conventions Metres, linear sRGB primaries.
 * @evidence contracts/anatomy.md#anatomical-source Jensen et al. 2001 Figure 5(b) supplies fitted skin1 optical coefficients; diffusion distances are derived and rounded, with arm-to-face and other-site use an authored approximation and population calibration unspecified.
 */
export const HUMAN_SKIN_FINISH: IAutoMovieHumanSkinFinish = {
  material: "skin",
  scattering: { r: 0.00367, g: 0.00137, b: 0.00068 },
};
