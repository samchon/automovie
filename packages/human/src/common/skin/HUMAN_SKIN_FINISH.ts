import type { IAutoMovieHumanSkinFinish } from "./IAutoMovieHumanSkinFinish";

/**
 * Source-owned skin finish consumed by the body builder and reusable by other builders.
 *
 * The scattering distance is the diffuse mean free path Jensen, Marschner,
 * Levoy and Hanrahan measured on skin ("A Practical Model for Subsurface
 * Light Transport", SIGGRAPH 2001, table of measured parameters, "skin1",
 * index of refraction 1.3): red 3.67 mm, green 1.37 mm, blue 0.68 mm. It is
 * one sample of skin on one person and is applied to every site and every
 * person, which is an authored extension of that measurement; no site or
 * pigmentation dependence was read.
 *
 * `material` identifies the skin material receiving this finish. Another
 * builder can apply the same record to agree on scattering at a shared join.
 *
 * @evidence contracts/common.md#principled-implementation One source-owned record supplies the body finish and lets another builder reuse the same authority rather than duplicate values that can drift.
 * @evidence contracts/common.md#clear-and-simple-design One constant; no per-site table until a per-site measurement exists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or renderer is special-cased; the value is a published measurement.
 * @evidence contracts/common.md#meaningful-documentation States the source, its sample and the extension made from it.
 * @evidence contracts/modeling.md#shared-boundaries Builders that apply this same record can give both sides of a skin join the same scattering; the body builder consumes it here.
 * @evidence contracts/modeling.md#spatial-conventions Metres, linear sRGB primaries.
 * @evidence contracts/anatomy.md#anatomical-source Jensen et al. 2001, SIGGRAPH: measured diffuse mean free path of one skin sample ("skin1"); the value is measured, and its use for all sites and people is an authored extension stated here.
 */
export const HUMAN_SKIN_FINISH: IAutoMovieHumanSkinFinish = {
  material: "skin",
  scattering: { r: 0.00367, g: 0.00137, b: 0.00068 },
};
