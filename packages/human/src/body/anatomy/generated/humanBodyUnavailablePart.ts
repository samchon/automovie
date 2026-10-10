import type { AutoMovieHumanBodyAnatomicalUnavailableReason } from "./AutoMovieHumanBodyAnatomicalUnavailableReason";
import type { IAutoMovieHumanBodyAnatomicalUnavailable } from "./IAutoMovieHumanBodyAnatomicalUnavailable";

/**
 * State why a region could not generate one named part.
 *
 * `request` is the part's own subtree of the detailed targets, or undefined
 * when the caller supplied none. An observed measurement anywhere in that
 * subtree is refused first as `acquisition-not-registered`, because no
 * generator registers an imaging or tape acquisition's posture, plane and
 * site yet; that reason is stated even where the part would also lack source
 * geometry. Otherwise the region's own `reason` for the part applies,
 * whether or not targets were supplied, since a target conditions a
 * generator that does not exist.
 *
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

const observed = (node: unknown): boolean =>
  typeof node === "object" &&
  node !== null &&
  ((node as Record<string, unknown>).kind === "observed" ||
    Object.values(node).some(observed));
