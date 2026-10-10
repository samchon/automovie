/** Independent paired exterior differences in millimetres, zero at the source neutral.
 * These authored chart supports establish neither bone nor fat reconstruction.
 * @author Samchon
 */
export interface IHumanHeadFacialRecipe {
  /** Anterior projection of the source left malar support. */
  leftMalarProjectionOffsetMillimetres: number;

  /** Anterior projection of the source right malar support. */
  rightMalarProjectionOffsetMillimetres: number;

  /** Posterior recession of the source left buccal support. */
  leftBuccalHollowOffsetMillimetres: number;

  /** Posterior recession of the source right buccal support. */
  rightBuccalHollowOffsetMillimetres: number;

  /** Lateral advancement of the source left mandibular support. */
  leftMandibularBreadthOffsetMillimetres: number;

  /** Lateral advancement of the source right mandibular support. */
  rightMandibularBreadthOffsetMillimetres: number;

  /** Anterior advancement of the source chin support. */
  chinProjectionOffsetMillimetres: number;

  /** Inferior advancement of the source chin support. */
  chinHeightOffsetMillimetres: number;
}
