import { HumanExactFraction } from "./HumanExactFraction";
import type { IHumanExactFraction } from "./IHumanExactFraction";
import type { IHumanExactFractionJson } from "./IHumanExactFractionJson";

/** Lossless JSON transport of the existing exact rational representation.
 * This owns persistence only; geometry still uses its canonical represented
 * interpolation and never normalizes coefficients independently per consumer.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Reduced positive-denominator fractions serialize as canonical decimal integer strings and decode back through exact normalization; noncanonical strings, negative zero and unreduced identities refuse.
 * @evidence contracts/common.md#clear-and-simple-design The static transport owner separates JSON persistence from geometry coefficient construction and shared exact arithmetic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Canonical checks protect integer identity without imposing anatomical bounds or silently normalizing an invalid persisted identity into an accepted one.
 * @evidence contracts/common.md#meaningful-documentation The class prose identifies lossless rational transport, persistence ownership and canonical interpolation retained by geometry; encode/decode comments specify normalization and refusal.
 * @evidence contracts/performance.md#efficient-algorithms Decimal string/BigInt conversion and GCD work scale with integer digits and bit widths; the class holds no geometry-sized data itself.
 * @evidence contracts/performance.md#reuse-equivalent-work Both directions reuse HumanExactFraction.create; no persistence cache equates mutable JSON strings or bypasses their canonical checks.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The class owns no persistent state or I/O handles; each conversion creates local integers/strings and transfers one result record to its caller.
 */
export class HumanExactFractionJson {
  /**
   * Encode one reduced rational as JSON-safe decimal integer strings.
   *
   * @evidence contracts/common.md#principled-implementation Normalize through HumanExactFraction.create, then emit decimal numerator/denominator strings so JSON preserves BigInt identity without Number rounding; invalid denominators retain create's refusal.
   * @evidence contracts/common.md#clear-and-simple-design Encoding owns transport formatting while the fraction owner decides canonical reduction/sign.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No precision-losing Number conversion, specimen exception or independent coefficient normalization formula replaces the shared exact owner.
   * @evidence contracts/common.md#meaningful-documentation The method comment describes reduced rational JSON-safe strings; IHumanExactFractionJson documents canonical zero and positive denominator.
   * @evidence contracts/performance.md#efficient-algorithms GCD reduction plus decimal formatting costs integer-bit-width/digit-dependent work and allocates two output strings.
   * @evidence contracts/performance.md#reuse-equivalent-work Canonical create is reused before persistence so unreduced direct fractions do not generate a second transport identity; no repeated-write cache changes effects.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The reduced record is temporary and two decimal strings transfer in the returned JSON record, with no retained file, buffer or asynchronous task.
   */
  static encode(value: IHumanExactFraction): IHumanExactFractionJson {
    const reduced: IHumanExactFraction = HumanExactFraction.create(
      value.numerator,
      value.denominator,
    );
    return {
      numerator: reduced.numerator.toString(),
      denominator: reduced.denominator.toString(),
    };
  }

  /**
   * Decode a canonical persisted identity; noncanonical encodings refuse.
   *
   * @evidence contracts/common.md#principled-implementation Decimal regexes require an optional-sign canonical numerator and positive denominator; BigInt parsing/create reduction must reproduce both exact original strings, rejecting negative zero and unreduced identities.
   * @evidence contracts/common.md#clear-and-simple-design Decoding combines transport spelling checks with the existing exact arithmetic normalizer rather than maintaining another GCD implementation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Noncanonical input refuses instead of being accepted after silent repair; no expected geometry coefficient or specimen branch bypasses the comparison.
   * @evidence contracts/common.md#meaningful-documentation The comment names canonical persisted identity and refusal, while the transport type gives decimal integer/positive-denominator semantics.
   * @evidence contracts/performance.md#efficient-algorithms Regex scans, decimal BigInt parsing, GCD reduction and round-trip formatting scale with input digits/bit widths, without touching any mesh.
   * @evidence contracts/performance.md#reuse-equivalent-work create supplies shared canonical rational reduction, and the same reduced result is used for identity checks and return; mutable persisted records are not memoized.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Parsed BigInts and round-trip strings are local; a normalized fraction transfers only after admission, and refusals acquire no persistent storage, handle or task.
   */
  static decode(value: IHumanExactFractionJson): IHumanExactFraction {
    if (
      value === undefined ||
      value === null ||
      typeof value.numerator !== "string" ||
      typeof value.denominator !== "string" ||
      !/^-?(0|[1-9]\d*)$/.test(value.numerator) ||
      !/^[1-9]\d*$/.test(value.denominator)
    )
      throw new Error(
        "Exact fraction JSON needs canonical decimal integers and a positive denominator.",
      );
    const reduced: IHumanExactFraction = HumanExactFraction.create(
      BigInt(value.numerator),
      BigInt(value.denominator),
    );
    if (
      reduced.numerator.toString() !== value.numerator ||
      reduced.denominator.toString() !== value.denominator
    )
      throw new Error(
        "Exact fraction JSON must retain its canonical reduced identity.",
      );
    return reduced;
  }
}
