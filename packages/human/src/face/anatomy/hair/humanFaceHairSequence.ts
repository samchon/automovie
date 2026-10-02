/**
 * Radical inverse shared by numerical hair roots, length variation and curl.
 * Callers supply a nonnegative safe sequence integer and an integer base above
 * one. Distinct prime bases choose independent coordinates of the same retained
 * sequence identity; no mutable random state or personal geometry participates.
 * Zero maps to zero. The operation reads scalar inputs and returns a scalar.
 *
 * @evidence contracts/common.md#principled-implementation The radical inverse
 *   of n in base b reverses n's base-b digits about the radix point: each pass
 *   takes the least significant digit as a remainder and adds it at weight
 *   b^-(i+1). The premises are a nonnegative safe integer index, so remainder
 *   and floor are exact in binary64, and an integer base above one. Distinct
 *   prime bases give the independent low-discrepancy coordinates of a Halton
 *   sequence. The weight is rebuilt by repeated division, so the last places
 *   carry rounding, and callers rely only on the result being deterministic.
 * @evidence contracts/common.md#clear-and-simple-design One stateless function
 *   with no options or dependencies; a caller selects a coordinate by its base.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special
 *   case for a style, subject or fixture: the value is a pure function of index
 *   and base.
 * @evidence contracts/common.md#meaningful-documentation The comment states
 *   what the value drives, the input preconditions, that zero maps to zero and
 *   that no random state exists.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The
 *   function computes a value and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function
 *   defines and consumes no channel; it reads an integer index and a base.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits
 *   no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The function
 *   reads and returns dimensionless scalars; it has no unit or frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds
 *   no surface and joins no neighbouring part.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function
 *   owns no part, group or joint and displays nothing; the builder that owns the
 *   assembled hair is where the result is observed.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries
 *   no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits,
 *   bounds or combines no anatomical quantity; assertHumanFaceHair owns
 *   admission of the hairstyle document.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input
 *   shapes a human form through this function; it reads quantities the hairstyle
 *   document already names and admits.
 */
export function humanFaceHairSequence(index: number, base: number): number {
  let inverse = 1 / base,
    result = 0;
  while (index > 0) {
    result += (index % base) * inverse;
    index = Math.floor(index / base);
    inverse /= base;
  }
  return result;
}
