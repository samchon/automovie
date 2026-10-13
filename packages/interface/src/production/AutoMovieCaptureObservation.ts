/**
 * Availability of one host-produced capture observation.
 *
 * The host records absence instead of manufacturing an observation. This type
 * carries the host's result; it does not decide whether absence is acceptable.
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
