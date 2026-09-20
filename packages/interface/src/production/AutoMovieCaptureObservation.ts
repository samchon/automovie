/**
 * Availability of one host-produced capture observation.
 *
 * The host records absence instead of manufacturing an observation. This type
 * carries the host's result; it does not decide whether absence is acceptable.
 *
 * @evidence requirements/rendering/validation.md#rendering-validation-status Distinguishes available evidence from an explicitly unperformed observation.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Preserves whether the selected host could produce the requested capture observation.
 *
 * @evidence requirements/agent-authoring/knowledge-boundary.md#agent-host-evidence Exposes `AutoMovieCaptureObservation` as the portable data boundary for the agent host evidence requirement.
 * @evidence specifications/authoring-and-authority/knowledge-evidence-and-tool-boundary.md#spec-authoring-host-evidence-output Types `AutoMovieCaptureObservation` for the spec authoring host evidence output system contract.
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
