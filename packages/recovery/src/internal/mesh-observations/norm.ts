import { V3 } from "./V3";
import { len } from "./len";
import { mul } from "./mul";

/**
 * Unit direction; a zero input remains zero so callers can handle degeneracy explicitly.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Dividing by Euclidean magnitude yields a unit direction; zero explicitly remains zero.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Reuses len and mul, with degeneracy admission left to the geometric caller.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Branches follow the declared operation or source protocol rather than specimen-specific coordinates or expected results.
 * @evidence contracts/development/common.md#meaningful-documentation States the operation, physical interpretation and its documented degeneracy or ownership limits.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic and one result triple.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each call depends directly on its arguments; no retained cache or effectful shared work exists.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh triple; no state survives the call.
 */
export const norm: (a: V3) => V3 = (a: V3): V3 => mul(a, 1 / (len(a) || 1));
