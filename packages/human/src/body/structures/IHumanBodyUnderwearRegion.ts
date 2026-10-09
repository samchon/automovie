/**
 * The coverage of one actual source material region before performance.
 *
 * @evidence contracts/common.md#principled-implementation Field and source ordinals use the original region corner table rather than a new render numbering.
 * @evidence contracts/common.md#clear-and-simple-design Surface, source correspondence and gathered field identify one region.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source ordinals come from the admitted region rather than a named person's vertex list.
 * @evidence contracts/common.md#meaningful-documentation States native-surface, source-corner and rest-field meanings.
 * @author Samchon
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Names an existing source region, not a new part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Contains evaluated coverage without controls.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Sources are ordinals and coverage uses rest-frame signed metre values.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The partition computes crossings.
 * @evidenceExclude contracts/modeling.md#rendered-observation Final garment consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Transports source coverage without anatomy.
 * @evidenceExclude contracts/anatomy.md#permitted-range Coverage owner retains admission.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no authoring input.
 */
export interface IHumanBodyUnderwearRegion {
  /** Native body surface supplying the region. */
  surface: number;

  /** Source ordinals in the original renderer-corner order. */
  sources: readonly number[];

  /** Rest coverage gathered through the same original corner table. */
  field: readonly number[];
}
