import { V3 } from "../geometry/V3.ts";

/**
 * Private transient PL critical point; serialize physical observations, never vertex addresses.
 *
 * @evidence contracts/common.md#principled-implementation A structural CriticalVertex declaration exposes its documented geometric or observation quantities without runtime conversion.
 * @evidence contracts/common.md#clear-and-simple-design This file owns only the named data boundary; computation remains in its explicit producers and consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is erased and contains no specimen-specific geometry or executable fallback.
 * @evidence contracts/common.md#meaningful-documentation Describes the quantity, private-data boundary or physical frame needed to interpret its members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 *
 * @author Samchon
 */
export interface CriticalVertex {
  /** Transient canonical source address, discarded before publishing observations. */
  vertex: number;
  /** Physical scalar projection onto the unit sweep axis. */
  level: number;
  /** Physical source location of the critical event. */
  p: V3;
  /** Number of connected components in the lower vertex link. */
  lower: number;
  /** Number of connected components in the upper vertex link. */
  upper: number;
  /** Whether neighbouring vertices share the exact scalar level and need a symbolic tie. */
  flat: boolean;
  /** Whether the complete welded link is one connected degree-two cycle. */
  manifold: boolean;
}
