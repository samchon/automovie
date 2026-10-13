import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Anterior quadriceps head crossing hip and knee from ilium to patella. Its separate volume cannot be inferred from a thigh girth or merged with the three vasti.
 *
 * This named belly accepts physical volume or MRI fat fraction, never skin vertices.
 *
 * @evidence contracts/common.md#principled-implementation The rectus femoris alias retains an independent volume/MRI-fat request through the common muscle measurement schema.
 * @evidence contracts/common.md#clear-and-simple-design Rectus ownership remains separate from the three vasti without copying quantitative definitions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts External thigh girth cannot supply its separate volume or merge its belly with neighboring heads.
 * @evidence contracts/common.md#meaningful-documentation The prose names rectus scope and the limits of inferred volume and combined quadriceps ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Rectus measurement typing runs no anterior-thigh surface or volume inversion.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Rectus identity retains no cached four-head muscle reconstruction.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The rectus alias acquires no anterior belly asset or active MRI instrument.
 * @author Samchon
 */
export type IAutoMovieHumanBodyRectusFemorisMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
