/** One lesser toe (second to fifth) proximal to distal, degrees (recalled, Greene and Heckman 1994; abduction a convention). Flexion curls the toe toward the sole; negative flexion is extension.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation One lesser toe (second to fifth) proximal to distal, degrees (recalled, Greene and Heckman 1994; abduction a convention).
 * @evidence contracts/development/design.md#principled-representation `mtpFlexion`: Metatarsophalangeal flexion 40, extension 40. `mtpAbduction`: Metatarsophalangeal abduction away from the second toe's line (the second toe: toward the fifth), 10 each way. `pipFlexion`: Proximal interphalangeal flexion, 0 to 35.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanToePose is the canonical exchange used by IAutoMovieHumanToePoseSchema, IAutoMovieHumanFootPose.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `mtpFlexion`: Metatarsophalangeal flexion 40, extension 40. `mtpAbduction`: Metatarsophalangeal abduction away from the second toe's line (the second toe: toward the fifth), 10 each way. `pipFlexion`: Proximal interphalangeal flexion, 0 to 35. `dipFlexion`: Distal interphalangeal flexion, 0 to 60.
 */
export interface IAutoMovieHumanToePose {
  /** Metatarsophalangeal flexion 40, extension 40. Schema constraints: Minimum: -40; Maximum: 40; retained by Human's schema refinement. */
  mtpFlexion?: number;

  /** Metatarsophalangeal abduction away from the second toe's line (the second toe: toward the fifth), 10 each way. Schema constraints: Minimum: -10; Maximum: 10; retained by Human's schema refinement. */
  mtpAbduction?: number;

  /** Proximal interphalangeal flexion, 0 to 35. Schema constraints: Minimum: 0; Maximum: 35; retained by Human's schema refinement. */
  pipFlexion?: number;

  /** Distal interphalangeal flexion, 0 to 60. Schema constraints: Minimum: 0; Maximum: 60; retained by Human's schema refinement. */
  dipFlexion?: number;
}
