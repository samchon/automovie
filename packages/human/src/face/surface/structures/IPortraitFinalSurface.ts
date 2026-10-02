import { IPortraitFinalSurfaceHost } from "./IPortraitFinalSurfaceHost";

/**
 * One component's requested final positions; shared attachments use the same IDs.
 *
 * @evidence contracts/common.md#principled-implementation A final surface is a function from the immutable post-layer host to a list of resident vertex identities with requested positions, so proposals cannot add topology and are collected before any is applied.
 * @evidence contracts/common.md#clear-and-simple-design One function type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitFinalSurface carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States that shared attachments use the same identities and that final shaping adds no topology.
 * @evidence contracts/modeling.md#spatial-conventions Targets are in the host's construction millimetres.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping IPortraitFinalSurface is a declaration and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitFinalSurface carries no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitFinalSurface decides no primitive population; it only describes data.
 * @evidenceExclude contracts/modeling.md#shared-boundaries IPortraitFinalSurface constructs no surface; it describes data only.
 * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitFinalSurface is a declaration and displays nothing itself; the parts built from it are observed by their owners.
 * @evidenceExclude contracts/anatomy.md#anatomical-source IPortraitFinalSurface carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range IPortraitFinalSurface admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority IPortraitFinalSurface defines no input through which a caller shapes a human form.
 */
export type IPortraitFinalSurface = (
  host: IPortraitFinalSurfaceHost,
) => readonly {
  /** Existing shared vertex identity; final shaping never adds topology here. */
  vertex: number;

  /** Requested XYZ in the host's millimetre frame. */
  target: readonly number[];
}[];
