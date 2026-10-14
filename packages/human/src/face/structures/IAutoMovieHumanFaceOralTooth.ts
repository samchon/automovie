/**
 * Independent dimensions and presence of one source crown in an authored oral
 * assembly. These are source-local geometric dimensions, not a clinical cast
 * measurement, anatomical CEJ registration or a claim about eruption. Omitted
 * dimensions retain that shared crown's current source shape. The first coarse
 * producer uses the shared head X/Y/Z axes, not a measured tooth long axis.
 *
 * @evidence contracts/common.md#principled-implementation Source head-X/Y/Z extents scale each native crown around its cervical centre; actual crown presence controls both emitted enamel and source query caps in the generated assembly.
 * @evidence contracts/common.md#clear-and-simple-design Independent dimensions and presence keep crown shape separate from arch placement and gingival collar dimensions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Positive finite mm extents and source registration are required; absent crowns are omitted instead of hidden through a material, while source-axis breadths do not become clinical MD/BL dimensions, exposure or eruption.
 * @evidence contracts/common.md#meaningful-documentation Each head axis and omitted-source behavior identify the actual coarse producer convention and its clinical registration limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no crown extent scan or mesh filtering.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Crown source identity is data rather than transformed-mesh caching here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Optional scalar/boolean requests create no native dental or query buffers.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOralTooth {
  /** Source head-X maximum breadth, positive finite mm; not clinical MD width. */
  widthMm?: number;

  /** Source head-Z maximum breadth, positive finite mm; not clinical BL width. */
  depthMm?: number;

  /** Source head-Y maximum extent, positive finite mm; not clinical exposure. */
  heightMm?: number;

  /** Actual authored crown presence; omission retains the source component. */
  present?: boolean;
}
