import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Large medial thigh adductor with pelvic origins and femoral insertions. Its compartment lies deep to the exterior thigh skin.
 *
 * This named belly accepts physical volume or MRI fat fraction, never skin vertices.
 *
 * @evidence contracts/common.md#principled-implementation The named adductor magnus belly reuses physical volume and Dixon fat-fraction inputs without exposing source vertices.
 * @evidence contracts/common.md#clear-and-simple-design A separate medial-thigh owner imports the common muscle schema instead of copying quantitative fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adductor measurement inputs infer neither external thigh shape nor validated internal surface.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies this independent belly and its volume/MRI composition controls.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Adductor input typing performs no medial-thigh geometry or volume solve.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A medial-thigh alias retains no achieved-volume or Dixon-reading cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Adductor metadata owns no acquired MRI bytes or generated belly mesh.
 * @author Samchon
 */
export type IAutoMovieHumanBodyAdductorMagnusMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
