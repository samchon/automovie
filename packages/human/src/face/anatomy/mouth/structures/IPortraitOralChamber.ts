/**
 * Interior room beyond the lip vestibule, independently of the visible aperture. The two nonnegative expansions are millimetres along head X and Y. A smooth depth transition preserves the actual rim; the existing posterior cap remains. This is authored enclosure geometry, not measured palate or gingival anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Nonnegative horizontal/vertical expansion and positive transition depth author room beyond the lip vestibule.
 * @evidence contracts/common.md#clear-and-simple-design Native lining expansion preserves actual rim identity and the existing cap.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This enclosure is not measured palate, gingiva or airway anatomy and does not relocate teeth.
 * @evidence contracts/common.md#meaningful-documentation All dimensions are millimetres, with zero expansions preserving original geometry.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Expansion arithmetic occurs in preparePortraitOralLining.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shared lining producer supplies direct and component chamber behavior.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller owns the scalar profile while preparation retains no chamber-dependent geometry beyond output.
 *
 * @author Samchon
 */
export interface IPortraitOralChamber {
  /** Additional transverse half-extent in mm, finite and nonnegative. */
  horizontalExpansion: number;

  /** Additional vertical half-extent in mm, finite and nonnegative. */
  verticalExpansion: number;

  /** Positive finite depth in mm at which expansion reaches its full weight. */
  transitionDepth: number;
}
