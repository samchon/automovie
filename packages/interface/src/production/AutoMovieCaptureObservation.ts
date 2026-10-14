/**
 * Availability of one host-produced capture observation.
 *
 * The host records absence instead of manufacturing an observation. This type carries the host's result; it does not decide whether absence is acceptable.
 *
 * @evidence contracts/common.md#principled-implementation Status discriminates a measured value from explicit non-execution, so capture verification can reject missing required observations without treating absence as a zero measurement.
 * @evidence contracts/common.md#clear-and-simple-design A generic value arm and a reason arm share one availability vocabulary for render observations and semantic masks, leaving their independent measurement schemas intact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Not-run cannot carry a fabricated measurement; the host supplies its reason and the capture path decides whether that absence permits publication.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes observation availability from acceptance and documents the available value and nonblank explanation for a measurement the host did not run.
 * @author Samchon
 */
export type AutoMovieCaptureObservation<T> =
  | {
      /** The host produced the observation. */
      status: "available";

      /** Host-produced observation value. */
      value: T;
    }
  | {
      /** The host did not perform the observation. */
      status: "not-run";

      /** Non-blank reason the observation was not performed. */
      reason: string;
    };
