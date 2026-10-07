import type { IAutoMovieHumanFaceBrowPopulation } from "../../structures/IAutoMovieHumanFaceBrowPopulation";

/**
 * A default eyebrow population for the skin-seated shaft builder: what a
 * document states when its author has no measurement of the person's brow.
 *
 * What each value rests on:
 *
 * - `radius` 0.025 mm is a rounded derived default. Kalmoni, Addai, Adjenti, Adutwum-Ofosu,
 *   Ahenkorah, Hottor and Blay, "Light Microscopic Morphology of Indigenous
 *   Ghanaian African Hair from Scalp, Eyebrow, Axilla, and Pubic Regions",
 *   Int J Trichology 2019;11(1):8-13: plucked eyebrow hair of 30 male and 30
 *   female indigenous Ghanaians aged 15 to 20, diameter by digital light
 *   microscopy at three points 1 mm apart, mean 53.97 um in males (95% CI
 *   49.13 to 58.81) and 46.69 um in females (42.24 to 51.14). The default is
 *   equal-weight sex mean diameter divided by two: 0.025165 mm, rounded to
 *   the existing 0.025 mm convention. Its use for other populations and ages is
 *   an authored extension.
 * - `strandCount` 250 is a clinical convention and not a read measurement:
 *   hair-restoration practice describes roughly 200 to 400 hairs per brow.
 *   No primary count was read.
 * - The flow follows the direction pattern hair-restoration practice
 *   describes and no measured field: hairs of the medial head point upward,
 *   hairs of the upper border run outward and downward, hairs of the lower
 *   border outward and upward, and the two converge along the body toward
 *   the tail. The four numbers of `grain` are authored to draw that pattern.
 * - `emergenceDegrees` 10 is authored. The same practice describes brow hair
 *   as leaving the skin at a very acute angle and lying nearly flat, without
 *   a number.
 * - Shaft length follows from the flow's bend and tips on the registered
 *   band and comes out at a few millimetres. No brow hair length was read.
 * - `taper`, `clearance`, `arch`, `segments`, the root extent and the end
 *   fades are authored drawing controls.
 *
 * A hair of this radius is narrower than a pixel at head framing, so the
 * population is visible as individual shafts only in a close view; how the
 * brow reads at the distance a shot uses is a matter for rendered
 * observation and is recorded in the campaign rounds.
 *
 * The connected document's whole-section omission selects this record through
 * resolveHumanFaceBrows; explicit sparse populations retain their own values.
 *
 * @evidence contracts/common.md#principled-implementation One record separates measured diameters, their derived and rounded default radius, and the other authoring conventions.
 * @evidence contracts/common.md#clear-and-simple-design A constant of the public population type; no second type or resolver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject is named and no value was tuned to pass an admission.
 * @evidence contracts/common.md#meaningful-documentation States the ground of every value and what the record cannot promise.
 * @evidence contracts/modeling.md#parameter-channels Each field keeps the meaning the population type gives it; left and right take this same record unless a document states an asymmetry.
 * @evidence contracts/modeling.md#spatial-conventions Lengths are millimetres, fractions are of the registered band, the angle is degrees, as the population type states.
 * @evidence contracts/modeling.md#emitted-geometry 250 shafts of 7 rings of 9 vertices per brow, 15,750 vertices, set by the count and segment fields alone.
 * @evidence contracts/anatomy.md#anatomical-source Kalmoni et al. 2019, Int J Trichology 11(1):8-13, measured diameter of plucked eyebrow hair in 60 Ghanaians aged 15 to 20; count, direction pattern and emergence are clinical conventions without a read primary measurement, and length is unread, all stated above.
 * @evidence contracts/anatomy.md#permitted-range The record lies inside the profile admission's bounds; those bounds are structural, and no anatomical interval for brow hair was read.
 * @evidence contracts/anatomy.md#parametric-authority Every field is a named shaft dimension, a count or a direction of the public population type; no vertex or curve is addressed.
 */
export const HUMAN_FACE_BROW_POPULATION: IAutoMovieHumanFaceBrowPopulation = {
  strandCount: 250,
  radius: 0.025,
  radiusStep: 0,
  taper: 0.8,
  clearance: 0.02,
  arch: 0.1,
  emergenceDegrees: 10,
  outwardBend: 4,
  segments: 6,
  rootLower: 0.05,
  rootUpper: 0.9,
  medialFade: 0.08,
  lateralFade: 0.2,
  densitySeed: 1,
  grain: { headTip: 0.75, headSweepMm: 1, convergence: 0.55, sweepMm: 4 },
};
