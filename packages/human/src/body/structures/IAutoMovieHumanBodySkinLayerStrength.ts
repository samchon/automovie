/**
 * Normalized intensity of one independently selected skin appearance layer.
 * Skin detail, tone and veins each carry their own record; sharing this value
 * shape couples neither their values nor their layer-specific calculations.
 *
 * @evidence contracts/common.md#principled-implementation Retains the existing normalized strength member used independently by each skin-layer owner.
 * @evidence contracts/common.md#clear-and-simple-design One named carrier replaces identical records without adding a computation or shared mutable state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Each skin detail, tone or vein field holds an independent strength record; type reuse neither clamps values nor couples the layers.
 * @evidence contracts/common.md#meaningful-documentation Explains independent layer records and normalized intensity.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part.
 * @evidence contracts/modeling.md#parameter-channels Zero retains no added layer response and positive strength increases that layer's authored response up to one; each document field remains independent.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Layer owners decide their emitted resources.
 * @evidence contracts/modeling.md#spatial-conventions Strength is dimensionless in [0,1], with zero selecting no added response for that specific layer.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Layer owners supply attachment and appearance.
 * @evidenceExclude contracts/modeling.md#rendered-observation The consuming appearance owner observes the layer.
 * @evidenceExclude contracts/anatomy.md#anatomical-source This renderer intensity represents no tissue thickness, concentration or physiological capacity.
 * @evidenceExclude contracts/anatomy.md#permitted-range Existing layer admission owns the interval and supported source dependencies.
 * @evidence contracts/anatomy.md#parametric-authority Each document field names its skin-detail, tone or vein appearance layer; the dimensionless strength preserves that owner's intensity meaning and does not expose personal vertices or tissue concentration.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySkinLayerStrength {
  /** Independent selected-layer intensity, dimensionless in [0,1]. */
  strength: number;
}
