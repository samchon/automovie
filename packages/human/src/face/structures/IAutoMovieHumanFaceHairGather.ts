/**
 * One scalp tie and its free tail, expressed as angular styling measurements.
 * The actual tie is the shared growth chart's outward ray hit on current scalp,
 * not a private coordinate or saved vertex. Angles are authored styling targets,
 * not measured follicle anatomy; no clinical protocol or population fit is
 * asserted. The existing contact owner supplies the current attachment.
 *
 * @evidence contracts/common.md#principled-implementation expandHumanFaceHairGather converts angular/mm traits into the shared scalp-attached tie and head-axis free tail; the gathered integrator follows current-domain metric gradients rather than a private chord through the head.
 * @evidence contracts/common.md#clear-and-simple-design One tie ray, neighbourhood strength and tail direction describe the two stages; optional spread radius/reach must be supplied together.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The expander refuses an incomplete spread pair and layer admission checks numerical bounds; attachment and turning/contact rejection remain actual consumers, not a promise that every tie can be reached.
 * @evidence contracts/common.md#meaningful-documentation Superior/anterior-to-left angle conventions, mm lengths and head-frame tail axes distinguish authored styling from coordinates or follicle measurements.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The trait schema implements no ray hit, graph propagation or curve integration.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work It specifies one shared tie but does not cache current-scalp queries.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No triangle graph, guide buffer or renderer state is retained by this record.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceHairGather {
  /** Tie ray polar angle from superior in [0,180] degrees. */
  polarDegrees: number;

  /** Tie ray azimuth from anterior toward anatomical left in [-180,180] degrees. */
  azimuthDegrees: number;

  /** Positive tie neighbourhood radius in millimetres. */
  radiusMm: number;

  /** Gathering attraction in (0,1], relative to the ordinary comb field. */
  strength: number;

  /** Direction of the free tail in the head frame after entering the tie. */
  tailDirection: "back" | "front" | "left" | "right" | "down";

  /** Optional nonnegative free-tail cross-section radius in millimetres; requires spreadReachMm. */
  spreadRadiusMm?: number;

  /** Optional positive spread transition arc length in millimetres; requires spreadRadiusMm. */
  spreadReachMm?: number;
}
