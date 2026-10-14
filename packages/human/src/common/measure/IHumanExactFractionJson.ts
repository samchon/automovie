/** JSON representation of a reduced exact rational, without BigInt loss.
 * Decimal strings retain integer identity; denominators are strictly positive.
 *
 *
 * @evidence contracts/common.md#principled-implementation Canonical decimal integer strings transport reduced exact rational identity without BigInt loss; numerator zero is 0 rather than negative zero and denominator is positive.
 * @evidence contracts/common.md#clear-and-simple-design JSON-safe spelling is separated from exact arithmetic and encode/decode admission in HumanExactFractionJson.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No lossy floating representation, target coefficient or silent noncanonical identity repair is prescribed.
 * @evidence contracts/common.md#meaningful-documentation The comments give reduced transport meaning, canonical zero spelling and strictly positive decimal denominator.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This serialized-fraction declaration runs no regex, parsing or normalization algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The string record coordinates no repeated persistence operation or result cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller-held decimal strings scale with supplied integer magnitude, but the type owns no persistent registry, file handle or task.
 *
 * @author Samchon
 */
export interface IHumanExactFractionJson {
  /** Canonical decimal numerator; zero is "0", never "-0". */
  numerator: string;

  /** Canonical positive decimal denominator. */
  denominator: string;
}
