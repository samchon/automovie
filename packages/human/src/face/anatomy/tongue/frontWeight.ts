/**
 * How much of the tongue's forward shaping reaches a given station.
 *
 * The smoothstep is inverted so the weight is one at the root and falls to zero
 * by the tip, with zero slope at both ends. That last part is why it is a cubic
 * rather than a straight line: a linear falloff leaves a crease where the
 * shaping stops, and the surface is sampled finely enough to show it.
 *
 * @evidence contracts/common.md#principled-implementation The weight is one minus the cubic smoothstep, so it is one at the tip station and zero at the root station with zero slope at both ends, which leaves no crease where the forward shaping stops and keeps the root end fixed.
 * @evidence contracts/common.md#clear-and-simple-design One function shared by the builder's advance and the component's jaw weighting, replacing a private copy.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No subject or fixture is named.
 * @evidence contracts/common.md#meaningful-documentation The comment states the endpoints, the zero slopes and why a cubic replaces a line.
 * @evidence contracts/modeling.md#spatial-conventions The argument is a unitless station and the result a unitless weight.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function is a weight and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no primitive.
 * @evidence contracts/modeling.md#shared-boundaries The builder's advance and the component's jaw rotation use this one weight, so the shaping and the jaw motion fade over the same stations and the posterior end stays fixed for both.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a form through this function.
 * @author Samchon
 */
export const frontWeight = (v: number): number => 1 - v * v * (3 - 2 * v);
