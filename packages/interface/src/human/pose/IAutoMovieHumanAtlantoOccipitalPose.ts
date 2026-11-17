/** Atlanto-occipital joint, skull on C1, degrees (recalled, White and Panjabi 1990).
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Atlanto-occipital joint, skull on C1, degrees (recalled, White and Panjabi 1990).
 * @evidence contracts/development/design.md#principled-representation `flexion`: Nod: chin-in flexion 10, chin-up extension 15. `lateralFlexion`: Head tilt, 5 each way; positive toward the person's left.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanAtlantoOccipitalPose is the canonical exchange used by IAutoMovieHumanAtlantoOccipitalPoseSchema, IAutoMovieHumanNeckPose.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `flexion`: Nod: chin-in flexion 10, chin-up extension 15. `lateralFlexion`: Head tilt, 5 each way; positive toward the person's left.
 */
export interface IAutoMovieHumanAtlantoOccipitalPose {
  /** Nod: chin-in flexion 10, chin-up extension 15. Schema constraints: Minimum: -15; Maximum: 10; retained by Human's schema refinement. */
  flexion?: number;

  /** Head tilt, 5 each way; positive toward the person's left. Schema constraints: Minimum: -5; Maximum: 5; retained by Human's schema refinement. */
  lateralFlexion?: number;
}
