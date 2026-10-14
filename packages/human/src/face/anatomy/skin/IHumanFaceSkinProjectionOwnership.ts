/**
 * A represented guide interval with a certified exact open-interval owner.
 * Bounds round actual ordered crossings; the sign is read between their
 * exact root enclosures, not from a rounded midpoint that could be a tie.
 *
 * @evidence contracts/common.md#principled-implementation Pair comparison certifies an exact open-interval distance sign between root enclosures while representing ordered boundaries in binary64; zero denotes an interval-wide polynomial tie.
 * @evidence contracts/common.md#clear-and-simple-design Bounds and signed first-versus-second ownership are sufficient for envelope merging without retaining a second feature-selection policy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Exact sign sampling avoids a rounded midpoint tie deciding the whole interval; unrepresentable crossing order refuses in the comparator.
 * @evidence contracts/common.md#meaningful-documentation Members explain parameter bounds and negative, positive and whole-interval-zero ownership rather than treating sign as a sampled distance.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This partition result type performs no root isolation or ownership calculation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The record schedules no work; comparator reuse belongs to the guide-local envelope cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Partition arrays belong to the comparator caller and retain no external handle or task.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinProjectionOwnership {
  /** Lower represented guide parameter of the interval. */
  lower: number;

  /** Upper represented guide parameter of the interval. */
  upper: number;

  /** Negative selects the first feature, positive the second, zero a whole-interval tie. */
  sign: number;
}
