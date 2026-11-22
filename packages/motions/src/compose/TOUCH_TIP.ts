/**
 * The last share of a carry's progress (`touchEnvelope`) over which a vessel leaned at the face (`ITouch.lean`) tips toward it, and the first share of the way back over which it is righted, by the hand's attitude (provisional: a drinker tips the glass at the lips).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the share, what it governs and that it is provisional.
 * @evidence contracts/development/design.md#principled-representation A share of the carry's progress, dimensionless, in (0, 1).
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the touch primitive and the held-attitude spec only.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: one value, read by the primitive; no copy.
 */
export const TOUCH_TIP: number = 0.25;
