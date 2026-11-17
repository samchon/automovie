/**
 * Clavicle at the sternoclavicular joint and scapula on the thorax, degrees (recalled, Neumann 2017). The acromioclavicular joint's small motions are folded into the scapula's upward rotation.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Clavicle at the sternoclavicular joint and scapula on the thorax, degrees (recalled, Neumann 2017).
 * @evidence contracts/development/design.md#principled-representation `elevation`: Clavicle elevation of the lateral end 45, depression 10. `upwardRotation`: Scapular upward rotation (glenoid turned up) 60, downward rotation 10: about a third of full arm elevation. `protraction`: Clavicle protraction (lateral end forward) 15, retraction 15.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanShoulderGirdlePose is the canonical exchange used by IAutoMovieHumanShoulderGirdlePoseSchema, IAutoMovieHumanArmPose.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `elevation`: Clavicle elevation of the lateral end 45, depression 10. `upwardRotation`: Scapular upward rotation (glenoid turned up) 60, downward rotation 10: about a third of full arm elevation. `protraction`: Clavicle protraction (lateral end forward) 15, retraction 15.
 */
export interface IAutoMovieHumanShoulderGirdlePose {
  /** Clavicle elevation of the lateral end 45, depression 10. Schema constraints: Minimum: -10; Maximum: 45; retained by Human's schema refinement. */
  elevation?: number;

  /** Scapular upward rotation (glenoid turned up) 60, downward rotation 10: about a third of full arm elevation. Schema constraints: Minimum: -10; Maximum: 60; retained by Human's schema refinement. */
  upwardRotation?: number;

  /** Clavicle protraction (lateral end forward) 15, retraction 15. Schema constraints: Minimum: -15; Maximum: 15; retained by Human's schema refinement. */
  protraction?: number;
}
