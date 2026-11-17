/** Big toe proximal to distal, degrees. Flexion curls the toe toward the sole; negative flexion is extension, lifting it.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Big toe proximal to distal, degrees.
 * @evidence contracts/development/design.md#principled-representation `mtpFlexion`: Metatarsophalangeal flexion 45, extension 70 (AAOS). `mtpAbduction`: Metatarsophalangeal abduction away from the second toe, 15 each way (convention). `ipFlexion`: Interphalangeal flexion, 0 to 90 (recalled, Greene and Heckman 1994).
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanHalluxPose is the canonical exchange used by IAutoMovieHumanHalluxPoseSchema, IAutoMovieHumanFootPose.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `mtpFlexion`: Metatarsophalangeal flexion 45, extension 70 (AAOS). `mtpAbduction`: Metatarsophalangeal abduction away from the second toe, 15 each way (convention). `ipFlexion`: Interphalangeal flexion, 0 to 90 (recalled, Greene and Heckman 1994).
 */
export interface IAutoMovieHumanHalluxPose {
  /** Metatarsophalangeal flexion 45, extension 70 (AAOS). Schema constraints: Minimum: -70; Maximum: 45; retained by Human's schema refinement. */
  mtpFlexion?: number;

  /** Metatarsophalangeal abduction away from the second toe, 15 each way (convention). Schema constraints: Minimum: -15; Maximum: 15; retained by Human's schema refinement. */
  mtpAbduction?: number;

  /** Interphalangeal flexion, 0 to 90 (recalled, Greene and Heckman 1994). Schema constraints: Minimum: 0; Maximum: 90; retained by Human's schema refinement. */
  ipFlexion?: number;
}
