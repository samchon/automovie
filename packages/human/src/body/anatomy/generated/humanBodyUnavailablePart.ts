import type { AutoMovieHumanBodyAnatomicalUnavailableReason } from "./AutoMovieHumanBodyAnatomicalUnavailableReason";
import type { IAutoMovieHumanBodyAnatomicalUnavailable } from "./IAutoMovieHumanBodyAnatomicalUnavailable";

/**
 * State why a region could not generate one named part.
 *
 * `request` is the part's own subtree of the detailed targets, or undefined when the caller supplied none. An observed measurement anywhere in that subtree is refused first as `acquisition-not-registered`, because no generator registers an imaging or tape acquisition's posture, plane and site yet; that reason is stated even where the part would also lack source geometry. Otherwise the region's own `reason` for the part applies, whether or not targets were supplied, since a target conditions a generator that does not exist. The request is an admitted finite acyclic document subtree. This function reads it without mutation and returns a new unavailable record; it does not register or validate acquisition geometry.
 *
 * @evidence contracts/common.md#principled-implementation Recursive observation detection gives acquisition-not-registered precedence within an admitted finite acyclic request subtree; otherwise the region's own cause is preserved.
 * @evidence contracts/common.md#clear-and-simple-design One shared unavailable-result owner applies acquisition precedence consistently across anatomical regions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A target cannot condition a nonexistent generator into producing geometry, and observations imply no registered acquisition site/posture.
 * @evidence contracts/common.md#meaningful-documentation The prose states subtree/omission meaning, observation precedence and unchanged region cause for non-observed requests.
 * @evidence contracts/performance.md#efficient-algorithms A short-circuit traversal costs O(N) subtree entries and O(D) recursion depth, plus temporary object-value arrays; admitted requests contain no cycles.
 * @evidence contracts/performance.md#reuse-equivalent-work Regions reuse this precedence function without caching caller subtrees that may differ by request.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Recursive values/arrays die with the call; one new failure record escapes and the request remains unchanged.
 * @author Samchon
 */
export function humanBodyUnavailablePart<Id extends string>(
  id: Id,
  request: unknown,
  reason: AutoMovieHumanBodyAnatomicalUnavailableReason,
): IAutoMovieHumanBodyAnatomicalUnavailable<Id> {
  return {
    id,
    status: "unavailable",
    reason: observed(request) ? "acquisition-not-registered" : reason,
  };
}

function observed(node: unknown): boolean {
  return typeof node === "object" &&
    node !== null &&
    ((node as Record<string, unknown>).kind === "observed" ||
      Object.values(node).some(observed));
}
