import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Deep quadriceps belly between femoral shaft and rectus femoris. An exterior thigh contour alone cannot separate its volume from the superficial heads.
 *
 * This named belly accepts physical volume or MRI fat fraction, never skin vertices.
 *
 * @evidence contracts/common.md#principled-implementation Intermedius aliases the muscle measurement contract and leaves deep boundary inference unresolved.
 * @evidence contracts/common.md#clear-and-simple-design The deep quadriceps belly has one named owner rather than a duplicated whole-thigh schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An exterior contour cannot silently separate deep intermedius from superficial quadriceps volume.
 * @evidence contracts/common.md#meaningful-documentation Prose states deep location and limits of exterior information for its independent quantity.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Intermedius typing performs no quadriceps compartment separation or volume integration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This deep-belly alias shares no computed thigh decomposition with other heads.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Intermedius vocabulary retains no deep-muscle mesh or imaging acquisition resource.
 * @author Samchon
 */
export type IAutoMovieHumanBodyVastusIntermediusMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
