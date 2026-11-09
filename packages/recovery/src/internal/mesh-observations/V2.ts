/**
 * Coordinates in an explicitly declared two-dimensional frame.
 *
 * @evidence contracts/development/design.md#principled-representation A structural V2 declaration exposes its documented geometric or observation quantities without runtime conversion.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This file owns only the named data boundary; computation remains in its explicit producers and consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declaration is erased and contains no specimen-specific geometry or executable fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Describes the quantity, private-data boundary or physical frame needed to interpret its members.
 */
export type V2 = [number, number];
