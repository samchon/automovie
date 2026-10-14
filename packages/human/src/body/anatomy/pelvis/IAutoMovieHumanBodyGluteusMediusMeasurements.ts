import type { IAutoMovieHumanBodyMuscleMeasurements } from "../measurements/IAutoMovieHumanBodyMuscleMeasurements";

/**
 * Target or observed gluteus medius volume or MRI fat fraction, deep to maximus.
 *
 * The ilium and facets of the femoral greater trochanter define its origin and insertion. Its separate CT/MRI volume must not be counted again as maximus or as subcutaneous adipose tissue. An observed volume alone leaves the tendon footprint and standing muscle surface unresolved.
 *
 * @evidence contracts/common.md#principled-implementation Medius aliases the muscle quantity schema while retaining independent deep-to-maximus tissue identity and provenance.
 * @evidence contracts/common.md#clear-and-simple-design One named gluteal belly owns its own volume/fraction without duplicating maximus or exterior adipose fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A measured volume does not supply its tendon footprint or justify double-counting adjacent tissues.
 * @evidence contracts/common.md#meaningful-documentation Prose names iliac/trochanteric relationships, tissue exclusions and unresolved standing muscle-surface geometry.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Medius typing executes no gluteal tissue separation or standing-surface solver.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This deep gluteal alias coordinates no equivalent trochanter reconstruction across muscle requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Medius measurements retain no segmented belly buffers or tendon-solving state.
 * @author Samchon
 */
export type IAutoMovieHumanBodyGluteusMediusMeasurements =
  IAutoMovieHumanBodyMuscleMeasurements;
