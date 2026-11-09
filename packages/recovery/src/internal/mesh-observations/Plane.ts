import { V3 } from "./V3";

/**
 * Right-handed physical cutting frame: u cross v = n, all axes unit.
 *
 * @evidence contracts/development/design.md#principled-representation A structural Plane declaration exposes its documented geometric or observation quantities without runtime conversion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This file owns only the named data boundary; computation remains in its explicit producers and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration is erased and contains no specimen-specific geometry or executable fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Describes the quantity, private-data boundary or physical frame needed to interpret its members.
 */
export interface Plane {
  /** Physical point on the plane in the source Cartesian frame. */
  origin: V3;
  /** Unit normal whose direction fixes the orientation convention. */
  n: V3;
  /** First unit in-plane axis; u cross v equals n. */
  u: V3;
  /** Second unit in-plane axis, orthogonal to u and n. */
  v: V3;
}
