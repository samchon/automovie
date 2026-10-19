import { V3 } from "./V3.ts";

/**
 * Source edge/plane intersection retained only in private observation extraction.
 *
 * @evidence contracts/common.md#principled-implementation A structural CutPoint declaration exposes its documented geometric or observation quantities without runtime conversion.
 * @evidence contracts/common.md#clear-and-simple-design This file owns only the named data boundary; computation remains in its explicit producers and consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is erased and contains no specimen-specific geometry or executable fallback.
 * @evidence contracts/common.md#meaningful-documentation Describes the quantity, private-data boundary or physical frame needed to interpret its members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 *
 * @author Samchon
 */
export interface CutPoint {
  /** Physical intersection on a source edge in the declared source frame. */
  p: V3;
  /** Ordered canonical connectivity labels of the original supporting edge; representative positions need not reproduce p. */
  a: number;
  /** Larger canonical connectivity label, retained privately without moving the original supporting edge. */
  b: number;
  /** Fraction along the original supporting source edge, oriented to match the a/b labels; interpolating canonical representative positions can differ from p. */
  t: number;
}
