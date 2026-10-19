import { CutPoint } from "./CutPoint";

/**
 * Connected ordered source section, retaining explicit closure instead of an artificial cap.
 *
 * @evidence contracts/common.md#principled-implementation A structural Polyline declaration exposes its documented geometric or observation quantities without runtime conversion.
 * @evidence contracts/common.md#clear-and-simple-design This file owns only the named data boundary; computation remains in its explicit producers and consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is erased and contains no specimen-specific geometry or executable fallback.
 * @evidence contracts/common.md#meaningful-documentation Describes the quantity, private-data boundary or physical frame needed to interpret its members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 *
 * @author Samchon
 */
export interface Polyline {
  /** True only when canonical source-cut adjacency returns to the first point. */
  closed: boolean;
  /** Ordered intersections; closure does not duplicate the first endpoint. */
  pts: CutPoint[];
}
