import { V3 } from "./V3.ts";
import { len } from "./len.ts";
import { mul } from "./mul.ts";

/**
 * Unit direction; a zero input remains zero so callers can handle degeneracy explicitly.
 *
 * @evidence contracts/common.md#principled-implementation Dividing by Euclidean magnitude yields a unit direction; zero explicitly remains zero.
 * @evidence contracts/common.md#clear-and-simple-design Reuses len and mul, with degeneracy admission left to the geometric caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/performance.md#efficient-algorithms Constant arithmetic and one result triple.
 * @evidence contracts/performance.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one fresh triple; no state survives the call.
 */
export const norm = (a: V3): V3 => mul(a, 1 / (len(a) || 1));
