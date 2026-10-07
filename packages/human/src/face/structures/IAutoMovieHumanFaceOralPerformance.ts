/**
 * Independent coarse lingual performance, separate from tongue identity and
 * the source jaw channels. Root attachment remains anchored; the oral assembly
 * judges passage and neighboring enclosure on the actual performed surface.
 * These targets do not simulate muscular recruitment or guarantee volume.
 *
 * @evidence contracts/common.md#principled-implementation Three named tip motions preserve identity separately from performed lingual changes.
 * @evidence contracts/common.md#clear-and-simple-design One value per superior, anterior and lateral trait.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A jaw motion does not substitute for independent tongue motion.
 * @evidence contracts/common.md#meaningful-documentation States the attachment and mechanics qualification.
 * @evidence contracts/modeling.md#parameter-channels Zero adds no lingual motion; positive lift is superior, advance anterior and lateral anatomical left.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in the source tongue's neutral head frame before mandibular articulation.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The tongue producer owns its part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The performance adds no primitive by itself.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The assembly preserves attachment and admits neighboring contact.
 * @evidenceExclude contracts/modeling.md#rendered-observation The oral assembly observes performance and return.
 * @evidence contracts/anatomy.md#anatomical-source Tip targets are authored visible performance conventions, not muscle or clinical physiological trajectories.
 * @evidenceExclude contracts/anatomy.md#permitted-range Contact and source geometry admit combinations.
 * @evidence contracts/anatomy.md#parametric-authority Motion uses named tip traits, not per-vertex deltas.
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOralPerformance {
  /** Superior tongue-tip lift from source pose, finite mm. */
  tongueTipLiftMm?: number;

  /** Anterior tongue-tip advance from source pose, finite mm. */
  tongueTipAdvanceMm?: number;

  /** Anatomical-left tongue-tip excursion from source pose, finite mm. */
  tongueTipLateralMm?: number;
}
