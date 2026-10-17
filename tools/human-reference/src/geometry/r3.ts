import { V3 } from "./V3.ts";

/**
 * Decimal presentation rounding; geometric computation must retain unrounded coordinates.
 *
 * @evidence contracts/common.md#principled-implementation Decimal rounding is a presentation operation distinct from geometric computation.
 * @evidence contracts/common.md#clear-and-simple-design The decimal count is explicit rather than a specimen-specific tolerance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms Constant work over three coordinates.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a new triple without modifying source coordinates.
 */
export const r3 = (v: V3, decimals: number = 3): V3 =>
  v.map((x: number): number => Number(x.toFixed(decimals))) as V3;
