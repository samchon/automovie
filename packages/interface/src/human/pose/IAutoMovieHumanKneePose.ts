/** Knee, degrees.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Knee, degrees.
 * @evidence contracts/development/design.md#principled-representation `flexion`: Flexion 139.8, hyperextension 1.3 (measured). `rotation`: Tibial rotation, external 35 and internal 25 (convention).
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanKneePose is the canonical exchange used by IAutoMovieHumanKneePoseSchema, IAutoMovieHumanLegPose.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `flexion`: Flexion 139.8, hyperextension 1.3 (measured). `rotation`: Tibial rotation, external 35 and internal 25 (convention).
 */
export interface IAutoMovieHumanKneePose {
  /** Flexion 139.8, hyperextension 1.3 (measured). Schema constraints: Minimum: -1.3; Maximum: 139.8; retained by Human's schema refinement. */
  flexion?: number;

  /**
   * Tibial rotation, external 35 and internal 25 (convention). It exists only with the knee bent: the stickman scales the range by flexion / 90, so a straight knee does not rotate. Schema constraints: Minimum: -25; Maximum: 35; retained by Human's schema refinement. */
  rotation?: number;
}
