import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Superficial lateral abdominal wall muscle from lower ribs to iliac crest and abdominal aponeurosis. It is not the same tissue as subcutaneous flank fat. One side's muscle belly accepts named volume or MRI fat fraction only.
 *
 * @evidence contracts/common.md#principled-implementation External oblique retains its same-side muscle-belly volume and MRI fat-fraction alternatives under the shared muscle measurement schema.
 * @evidence contracts/common.md#clear-and-simple-design Trunk ownership identifies the superficial lateral belly while acquisition details remain with common muscle quantities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Subcutaneous flank fat or an abdominal silhouette cannot replace this muscle's independent internal measurements.
 * @evidence contracts/common.md#meaningful-documentation The prose identifies lower-rib/iliac/aponeurotic relationships and separates the belly from overlying adipose.
 * @evidenceExclude contracts/performance.md#efficient-algorithms External-oblique typing performs no lateral wall segmentation or abdominal muscle mechanics.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The superficial abdominal muscle alias stores no reusable compartment reconstruction or side registration.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources External-oblique metadata retains no lateral tissue boundary or abdominal solve task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyExternalObliqueMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
