/**
 * Fresh current hair-contact collider arrays.
 * The closure producer appends centroid vertices and directed fan triangles without mutating the source arrays.
 * The hair builder consumes this query-only surface; it is not displayed skin.
 *
 * @evidence contracts/common.md#principled-implementation Separate owned position and index arrays carry the rebuilt collider without changing source geometry.
 * @evidence contracts/common.md#clear-and-simple-design closeHumanFaceHairContact returns these two owned arrays for the hair builder's query-only closed collider.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Carries actual source geometry and derived state without a subject-specific replacement.
 * @evidence contracts/common.md#meaningful-documentation States newly owned buffers, appended centroid incidence and the distinction from displayed skin.
 * @evidence contracts/modeling.md#spatial-conventions Flat current positions use head-frame metres; triangle indices address the retained vertices and newly appended closure centroids.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Carries geometry for an existing scalp and hair population without assigning a new part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Internal compiler state preserves the hairstyle document's controls and defines no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The resolver, graph or closure producer owns derived geometry; this record carries its inputs or result.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Source admission and hair-contact construction own topology; this record changes neither.
 * @evidenceExclude contracts/modeling.md#rendered-observation The hair builder owns the displayed assembly; this numerical carrier supplies no observed result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The basis owns source qualification; this carrier introduces no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Hairstyle admission retains numerical controls and bounds; this record adds no physiological range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal source and derived geometry are not personal authoring fields.
 * @author Samchon
 */
export interface IHumanFaceHairContactSurface {
  /** Current head-frame metre positions including closure centroids. */
  positions: number[];

  /** Original incidence followed by directed closure triangles. */
  indices: number[];
}
