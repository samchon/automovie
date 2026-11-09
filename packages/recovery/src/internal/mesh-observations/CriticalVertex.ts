import { V3 } from "./V3";

/**
 * Private transient PL critical point; serialize physical observations, never vertex addresses.
 *
 * @evidence contracts/development/design.md#principled-representation A structural CriticalVertex declaration exposes its documented geometric or observation quantities without runtime conversion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This file owns only the named data boundary; computation remains in its explicit producers and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration is erased and contains no specimen-specific geometry or executable fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Describes the quantity, private-data boundary or physical frame needed to interpret its members.
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
