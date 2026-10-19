import { V3 } from "./V3";
import { len } from "./len";
import { sub } from "./sub";

/**
 * Euclidean point distance in the points' common physical units.
 *
 * @evidence contracts/common.md#principled-implementation The magnitude of the point difference is Euclidean separation in a common frame.
 * @evidence contracts/common.md#clear-and-simple-design Reuses subtraction and magnitude instead of duplicating distance algebra.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms Constant arithmetic with one temporary displacement.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary and result scalars become unreachable after return.
 */
export const dist: (a: V3, b: V3) => number = (a: V3, b: V3): number =>
  len(sub(a, b));
