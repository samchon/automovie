import { ObservedLoop } from "./ObservedLoop.ts";

/**
 * Physical horizontal source section retaining all closed contours and explicit open fragments.
 *
 * @evidence contracts/common.md#principled-implementation A structural SectionSlice declaration exposes its documented geometric or observation quantities without runtime conversion.
 * @evidence contracts/common.md#clear-and-simple-design This file owns only the named data boundary; computation remains in its explicit producers and consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is erased and contains no specimen-specific geometry or executable fallback.
 * @evidence contracts/common.md#meaningful-documentation Describes the quantity, private-data boundary or physical frame needed to interpret its members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 *
 * @author Samchon
 */
export interface SectionSlice {
  /** Native-root horizontal plane height in millimetres. */
  y: number;
  /** Every retained closed physical source contour at this plane. */
  loops: ObservedLoop[];
  /** Number of open source-cut fragments containing more than two points. */
  open: number;
}
