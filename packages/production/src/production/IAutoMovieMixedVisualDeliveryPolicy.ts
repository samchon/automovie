import { IAutoMovieVisualDeliveryTransition } from "./IAutoMovieVisualDeliveryTransition";

/**
 * Mixed-lane policy tied to one current aggregate observation digest and every directed unlike-lane crossing in order. All-one-lane delivery omits this policy; a supplied policy there is refused by the planner. Review digests carry declared assertions, not fresh playback.
 *
 * @evidence contracts/common.md#principled-implementation Version1 and exact observation identity bind the ordered crossing population to the current mixed occurrence lanes.
 * @evidence contracts/common.md#clear-and-simple-design One aggregate policy supplies transitions while source/receipt and sequence observation admission keep their own boundaries.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing mixed policy refuses, and extraneous one-lane policy is not accepted as a review substitute; transition artifact truth is outside this record.
 * @evidence contracts/common.md#meaningful-documentation Prose states required mixed versus absent one-lane meaning and ordered current-observation linkage.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This schema performs no crossing comparison, canonical hash or visual observation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A digest link implements no reuse coordinator or policy invalidation mechanism by itself.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The interface allocates no transition array or playback resources; runtime producers own policy retention.
 * @author Samchon
 */
export interface IAutoMovieMixedVisualDeliveryPolicy {
  /** Policy schema version. */
  version: 1;

  /** Digest of the aggregate sequence observation the policy was reviewed against. */
  observationDigest: string;

  /** Every reviewed crossing between unlike lanes, in timeline order. */
  transitions: IAutoMovieVisualDeliveryTransition[];
}
