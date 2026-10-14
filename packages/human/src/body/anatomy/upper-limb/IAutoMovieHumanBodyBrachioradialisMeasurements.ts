import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Superficial lateral forearm brachioradialis from humerus to distal radius.
 *
 * It crosses the elbow despite belonging to the forearm region. Its belly volume is not the full forearm flexor compartment or skin circumference.
 *
 * @evidence contracts/common.md#principled-implementation Brachioradialis retains named belly-volume/PDFF measurements independently from the surrounding forearm compartment.
 * @evidence contracts/common.md#clear-and-simple-design Forearm ownership names the elbow-crossing muscle while shared muscle schemas own acquisition semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts One lateral belly volume cannot substitute for the complete forearm flexor compartment or skin circumference.
 * @evidence contracts/common.md#meaningful-documentation The prose gives humeral-to-distal-radius scope despite forearm regional ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Brachioradialis typing performs no lateral forearm compartment integration or tendon fitting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This elbow-crossing belly alias owns no reusable humeral/radial attachment reconstruction.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Brachioradialis quantity records retain no forearm tissue boundary or elbow-registration handle.
 * @author Samchon
 */
export type IAutoMovieHumanBodyBrachioradialisMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
