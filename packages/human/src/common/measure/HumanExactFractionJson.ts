import { HumanExactFraction } from "./HumanExactFraction";
import type { IHumanExactFraction } from "./IHumanExactFraction";
import type { IHumanExactFractionJson } from "./IHumanExactFractionJson";

/** Lossless JSON transport of the existing exact rational representation.
 * This owns persistence only; geometry still uses its canonical represented
 * interpolation and never normalizes coefficients independently per consumer.
 *
 * @evidence contracts/common.md#principled-implementation Canonical reduced decimal integers round trip through JSON without conversion to Number.
 * @evidence contracts/common.md#clear-and-simple-design Encode and decode share the existing reduction owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed or noncanonical rationals refuse rather than being repaired on admission.
 * @evidence contracts/common.md#meaningful-documentation Separates exact persisted identity from represented geometric interpolation.
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
export class HumanExactFractionJson {
  /**
   * Encode one reduced rational as JSON-safe decimal integer strings.
   *
   * @evidence contracts/common.md#principled-implementation Existing rational reduction supplies the canonical positive-denominator identity.
   * @evidence contracts/common.md#clear-and-simple-design Returns owned strings without retaining the source object.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No floating conversion or coordinate rounding enters persistence.
   * @evidence contracts/common.md#meaningful-documentation Names the exact JSON representation.
   * @evidenceExclude contracts/modeling.md#spatial-conventions Serialization has no physical frame or unit; geometry consumers own them.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Serializes numerical values without defining a part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
   * @evidenceExclude contracts/modeling.md#shared-boundaries Native correspondence consumers own geometric joins.
   * @evidenceExclude contracts/modeling.md#rendered-observation JSON transport supplies no rendered observation.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical norm or measurement.
   * @evidenceExclude contracts/anatomy.md#permitted-range Source and anatomy consumers own their ranges.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal coordinate or sculpt control.
   */
  static encode(value: IHumanExactFraction): IHumanExactFractionJson {
    const reduced = HumanExactFraction.create(value.numerator, value.denominator);
    return { numerator: reduced.numerator.toString(), denominator: reduced.denominator.toString() };
  }

  /**
   * Decode a canonical persisted identity; noncanonical encodings refuse.
   *
   * @evidence contracts/common.md#principled-implementation Integer parsing and reduction verify identity without a Number intermediary.
   * @evidence contracts/common.md#clear-and-simple-design One guard checks syntax and one checks canonical reduction.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Negative/zero denominator, leading zeros and unreduced values are not silently normalized.
   * @evidence contracts/common.md#meaningful-documentation States canonical admission rather than permissive parsing.
   * @evidenceExclude contracts/modeling.md#spatial-conventions Serialization has no physical frame or unit; geometry consumers own them.
   * @evidenceExclude contracts/modeling.md#part-identity-and-grouping Serializes numerical values without defining a part.
   * @evidenceExclude contracts/modeling.md#parameter-channels Adds no authoring channel.
   * @evidenceExclude contracts/modeling.md#emitted-geometry Emits no geometry.
   * @evidenceExclude contracts/modeling.md#shared-boundaries Native correspondence consumers own geometric joins.
   * @evidenceExclude contracts/modeling.md#rendered-observation JSON transport supplies no rendered observation.
   * @evidenceExclude contracts/anatomy.md#anatomical-source Carries no anatomical norm or measurement.
   * @evidenceExclude contracts/anatomy.md#permitted-range Source and anatomy consumers own their ranges.
   * @evidenceExclude contracts/anatomy.md#parametric-authority Adds no personal coordinate or sculpt control.
   */
  static decode(value: IHumanExactFractionJson): IHumanExactFraction {
    if (value === undefined || value === null || typeof value.numerator !== "string" ||
        typeof value.denominator !== "string" || !/^-?(0|[1-9]\d*)$/.test(value.numerator) ||
        !/^[1-9]\d*$/.test(value.denominator))
      throw new Error("Exact fraction JSON needs canonical decimal integers and a positive denominator.");
    const reduced = HumanExactFraction.create(BigInt(value.numerator), BigInt(value.denominator));
    if (reduced.numerator.toString() !== value.numerator || reduced.denominator.toString() !== value.denominator)
      throw new Error("Exact fraction JSON must retain its canonical reduced identity.");
    return reduced;
  }
}
