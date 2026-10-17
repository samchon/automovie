import { V3 } from "../geometry/V3.ts";
import { LoopRecord } from "../schema/LoopRecord.ts";

/**
 * Ordered measured contour with its original surface orientation and separate display observations.
 *
 * @evidence contracts/common.md#principled-implementation A structural ObservedLoop declaration exposes its documented geometric or observation quantities without runtime conversion.
 * @evidence contracts/common.md#clear-and-simple-design This file owns only the named data boundary; computation remains in its explicit producers and consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is erased and contains no specimen-specific geometry or executable fallback.
 * @evidence contracts/common.md#meaningful-documentation Describes the quantity, private-data boundary or physical frame needed to interpret its members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 *
 * @author Samchon
 */
export interface ObservedLoop extends LoopRecord {
  /** Source-facing sign: positive outer, negative cavity; zero remains unresolved. */
  winding: number;
  /** Canonical-edge sampled source vertex-normal field, not physical derivatives of a fitted surface. */
  normals: V3[];
  /** Strict projected source crossings; tangencies and collinear overlap remain unclassified. */
  sourceSelfCrossings: number;
}
