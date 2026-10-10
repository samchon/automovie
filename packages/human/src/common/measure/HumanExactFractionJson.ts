import { HumanExactFraction } from "./HumanExactFraction";
import type { IHumanExactFraction } from "./IHumanExactFraction";
import type { IHumanExactFractionJson } from "./IHumanExactFractionJson";

/** Lossless JSON transport of the existing exact rational representation.
 * This owns persistence only; geometry still uses its canonical represented
 * interpolation and never normalizes coefficients independently per consumer.
 *
 * @author Samchon
 */
export class HumanExactFractionJson {
  /**
   * Encode one reduced rational as JSON-safe decimal integer strings.
   */
  static encode(value: IHumanExactFraction): IHumanExactFractionJson {
    const reduced = HumanExactFraction.create(value.numerator, value.denominator);
    return { numerator: reduced.numerator.toString(), denominator: reduced.denominator.toString() };
  }

  /**
   * Decode a canonical persisted identity; noncanonical encodings refuse.
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
