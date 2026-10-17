/**
 * Physical source-cut bounds and collision-search windows for an oral chart.
 * Every value uses world millimetres in the admitted native source frame;
 * these are explicitly supplied geometric conventions, not population anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Independent physical bounds expose the exact source observation protocol.
 * @evidence contracts/common.md#clear-and-simple-design One scope owns all cuts and collision admission windows.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source identity, raw coordinates or fixed clinical dimensions are embedded in the tool.
 * @evidence contracts/common.md#meaningful-documentation States units, source posture and the conventional meaning of every bound.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This structural type chooses no algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This structural type coordinates no execution.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This structural type owns no runtime resources.
 * @author Samchon
 */
export interface MouthObservationScope {
  /** Subject-right exterior collar X coordinate in world millimetres. */
  xMinimum: number;

  /** Subject-left exterior collar X coordinate in world millimetres. */
  xMaximum: number;

  /** Upper exterior collar Y coordinate in world millimetres. */
  topY: number;

  /** Lower exterior collar Y coordinate in world millimetres. */
  bottomY: number;

  /** Excludes body intersections below the head support. */
  clipY: number;

  /** Lowest admitted collision Y coordinate in world millimetres. */
  collisionMinimumY: number;

  /** Highest admitted collision Y coordinate in world millimetres. */
  collisionMaximumY: number;

  /** Most posterior admitted collision Z coordinate in world millimetres. */
  collisionMinimumZ: number;

  /** Maximum spacing between sagittal source cuts, in millimetres. */
  spacingMm: number;

  /** Maximum contact-event bracket width along world X, in millimetres. */
  eventToleranceMm: number;

  /** Records how these bounds were obtained for this source. */
  definition: string;
}
