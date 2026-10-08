/** JSON representation of a reduced exact rational, without BigInt loss.
 * Decimal strings retain integer identity; denominators are strictly positive.
 *
 * @evidence contracts/common.md#principled-implementation Decimal integer strings preserve the exact reduced numerator and denominator through JSON.
 * @evidence contracts/common.md#clear-and-simple-design Two named strings carry one rational value.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Canonical integer strings transport exact correspondence without rounding or independently normalizing consumer coefficients.
 * @evidence contracts/common.md#meaningful-documentation States reduction, integer encoding and denominator sign.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Serialization has no physical frame or unit; geometry consumers own them.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Serializes numerical values without defining a part.
 * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authoring channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
 * @evidenceExclude contracts/modeling.md#shared-boundaries Native correspondence consumers own geometric joins.
 * @evidenceExclude contracts/modeling.md#rendered-observation JSON transport supplies no rendered observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical norm or measurement.
 * @evidenceExclude contracts/anatomy.md#permitted-range Source and anatomy consumers own their ranges.
 * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal coordinate or sculpt control.
 * @author Samchon
 */
export interface IHumanExactFractionJson {
  /** Canonical decimal numerator; zero is "0", never "-0". */
  numerator: string;

  /** Canonical positive decimal denominator. */
  denominator: string;
}
