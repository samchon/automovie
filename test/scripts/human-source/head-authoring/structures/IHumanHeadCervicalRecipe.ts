/** Shared-root cervical exterior differences in millimetres.
 * Joint span consumes the licensed whole-source neck-height endpoint and moves
 * the skin and its joint witnesses together; it is not clinical neck height.
 * @author Samchon
 */
export interface IHumanHeadCervicalRecipe {
  /** Anterior throat fullness at the authored source support. */
  anteriorFullnessOffsetMillimetres: number;

  /** Posterior neck fullness at the authored source support. */
  posteriorFullnessOffsetMillimetres: number;

  /** Anterior advancement of the source underside transition. */
  cervicomentalProjectionOffsetMillimetres: number;

  /** Difference of joint-head minus joint-neck along native Blender Z. */
  cervicalJointSpanOffsetMillimetres: number;
}
