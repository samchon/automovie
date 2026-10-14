import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A point carried to a requested free offset from the same hair collider, returned by the `retract` reader of `humanFaceHairContact`.
 *
 * A nearest-feature hit proposes the point at the requested outward offset. A second query confirms the proposed point's signed distance within epsilon and at least clearance minus epsilon; its closest feature need not be the placing hit. The returned normal belongs to that placing hit. Concave or ambiguous geometry that never settles refuses instead of returning.
 *
 * @evidence contracts/common.md#principled-implementation A second signed query checks requested offset within epsilon and the clearance-minus-epsilon floor; the returned normal identifies the proposing hit, and nonconvergence refuses.
 * @evidence contracts/common.md#clear-and-simple-design A point and placing-hit normal expose exactly the geometry needed by gather transport after contact-owned retraction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The result does not weaken the requested gap or claim an unconverged point; those failures stay with the contact owner.
 * @evidence contracts/common.md#meaningful-documentation The comment gives current metre position, unit placing normal, epsilon confirmation and the nonconvergence refusal.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The retraction-result schema implements no projection loop; humanFaceHairContact.retract owns its bounded query iterations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A returned point/normal pair is one offset solution, with no cross-offset cache or reuse protocol declared by this type.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only owned numerical output escapes retraction; the shared collider and query budget remain with their existing owners.
 *
 * @author Samchon
 */
export interface IHumanFaceHairRetraction {
  /** Retracted position whose signed offset agrees with the request within contact epsilon, in current head-frame metres. */
  point: IAutoMovieVector3;

  /** Unit outward skin normal at the hit that placed `point`. */
  normal: IAutoMovieVector3;
}
