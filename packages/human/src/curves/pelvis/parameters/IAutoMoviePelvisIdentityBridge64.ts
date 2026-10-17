/** Optional independent physical observations absent from the current public identity. Omitted values use explicit resolver conventions; they are not clinical estimates or calibration-gate lookups.
 *
 * @author Samchon
 */
export namespace IAutoMoviePelvisIdentityBridge64 {
  /** Seven supplemental physical observations for one upright specimen. Heights use the skeleton's support-plane chart, lengths use millimetres and thigh aspects are dimensionless. Resolver range and consistency checks still apply.
   *
   * @author Samchon
   */
  export interface Independent {
    /** Buttock maximum support-plane height in millimetres in the upright specimen chart; omission uses hips Y minus .007 stature as an authoring convention.
     */
    buttockMaximumHeightMm: number;

    /** Anterior reach from the construction origin in millimetres; default .45 buttock depth is a fore-aft partition convention, not an observed individual value.
     */
    buttockAnteriorReachMm: number;

    /** Posterior median recess from the posterior lanes in millimetres; default .06 buttock depth is a coarse cleft convention.
     */
    posteriorMedianRecessMm: number;

    /** Full iliac skin-envelope breadth in millimetres; default bony breadth plus two flank-fat layers is an explicit envelope convention.
     */
    iliacSkinBreadthMm: number;

    /** Nongenital median crown support-plane height in millimetres; the external R6b resolver requires it below its virtual near-thigh course and defaults to that course minus .02 mean upper-leg length.
     */
    perinealCrownHeightMm: number;

    /** Positive dimensionless left-thigh breadth/depth aspect used with circumference to derive cubic-section axes; default one is not a clinical inference.
     */
    leftThighBreadthOverDepth: number;

    /** Positive dimensionless right-thigh breadth/depth aspect used with circumference to derive cubic-section axes; default one is not a clinical inference.
     */
    rightThighBreadthOverDepth: number;
  }
}
