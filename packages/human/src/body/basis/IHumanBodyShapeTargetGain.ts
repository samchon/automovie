/**
 * One planned row-target application inside `applyHumanBodyShapeRows`.
 *
 * The planner records every active channel endpoint and corrective first, in
 * application order, so an unavailable source target refuses before the first
 * buffer write. The gain is already non-negative: a negative channel weight
 * selects the negative endpoint and contributes its absolute value.
 *
 * @evidence contracts/common.md#principled-implementation Separates selection of endpoint and gain from the additive application, which lets availability refuse before mutation.
 * @evidence contracts/common.md#clear-and-simple-design A two-field record of plan state replaces an anonymous array element type.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Records only targets the admitted weights and activations select.
 * @evidence contracts/common.md#meaningful-documentation States the owner, the ordering role and the sign convention of the gain.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Holds a target name and a scalar; the rows own their metres.
 * @evidence contracts/modeling.md#parameter-channels A channel's signed weight becomes its selected endpoint and absolute gain; correctives keep their activation.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The caller owns the shared buffer.
 * @evidenceExclude contracts/modeling.md#rendered-observation Internal plan state is not displayed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admission already bounded the weights.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Internal state derived from admitted channels.
 * @author Samchon
 */
export interface IHumanBodyShapeTargetGain {
  /** Basis row-target name: a channel endpoint or a corrective target. */
  target: string;
  /** Non-negative multiplier applied to every offset of `target`. */
  gain: number;
}
