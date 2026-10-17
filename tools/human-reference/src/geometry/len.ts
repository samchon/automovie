import { V3 } from "./V3.ts";

/**
 * Euclidean vector magnitude, retaining the operand's units.
 *
 * @evidence contracts/common.md#principled-implementation Math.hypot computes Euclidean magnitude without changing physical units.
 * @evidence contracts/common.md#clear-and-simple-design A scalar reduction avoids temporary vector allocations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms Constant three-coordinate arithmetic.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a scalar and retains no references.
 */
export const len = (a: V3): number => Math.hypot(a[0], a[1], a[2]);
