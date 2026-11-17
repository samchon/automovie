/** Atlanto-axial joint, C1 on C2, degrees (recalled, White and Panjabi 1990).
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Atlanto-axial joint, C1 on C2, degrees (recalled, White and Panjabi 1990).
 * @evidence contracts/development/design.md#principled-representation `rotation`: Head rotation, 40 each way; positive turns the face toward the person's left.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanAtlantoAxialPose is the canonical exchange used by IAutoMovieHumanAtlantoAxialPoseSchema, IAutoMovieHumanNeckPose.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `rotation`: Head rotation, 40 each way; positive turns the face toward the person's left.
 */
export interface IAutoMovieHumanAtlantoAxialPose {
  /** Head rotation, 40 each way; positive turns the face toward the person's left. Schema constraints: Minimum: -40; Maximum: 40; retained by Human's schema refinement. */
  rotation?: number;
}
