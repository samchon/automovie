/**
 * Optional physical measurements missing from the public leg identity.
 * Each side can override them separately. Omitted values use declared priors;
 * supplied values must be finite, positive and compatible with plane ordering.
 * No member is a control coordinate, reference origin or gate identifier.
 *
 * @author Samchon
 */
export namespace IAutoMovieLegIdentityBridge64 {
  /** Optional dimensions supplementing public girths, lengths and actual bone landmarks. Each side can override them separately.
   *
   * @author Samchon
   */
  export interface Independent {
    /** Positive thigh breadth/depth ratio; omitted means the actual pelvis cut's cardinal ratio. */
    thighBreadthOverDepth: number;

    /** Positive calf breadth/depth ratio; omitted uses the circular-section convention 1. */
    calfBreadthOverDepth: number;

    /** Breadth at the virtual minimum ankle course, mm; must be below half its circumference. */
    ankleBreadthMm: number;

    /** Patella height, mm; half this locates the suprapatellar proxy above its centre. */
    patellaHeightMm: number;

    /** Circumference at the patella-centre course, mm; distinct from the public suprapatellar girth. */
    kneeCircumferenceMm: number;

    /** Circumference at tibiale minus 6% clinical shank length, mm. */
    belowKneeCircumferenceMm: number;

    /** Maximum calf course's proximal distance from the actual ankle joint, mm. */
    calfMaximumHeightAboveAnkleMm: number;

    /** Virtual minimum-girth plane's proximal distance from the ankle joint, mm. */
    ankleMinimumHeightAboveJointMm: number;

    /** Foot-join plane's distance above the ankle joint, mm; greater than minimum-plane height. */
    ankleCutHeightAboveJointMm: number;

    /** Anterior bone-axis-to-skin reach at maximum calf, mm; less than its section depth. */
    calfAnteriorReachMm: number;

    /** Anterior bone-axis-to-skin reach at minimum ankle, mm; less than its section depth. */
    ankleAnteriorReachMm: number;
  }
}
