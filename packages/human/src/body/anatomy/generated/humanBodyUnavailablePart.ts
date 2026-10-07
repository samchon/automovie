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
 * @evidence contracts/common.md#principled-implementation The observation check reads the caller's actual subtree; the region keeps ownership of its source reason.
 * @evidence contracts/common.md#clear-and-simple-design One rule shared by every region resolver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Supplied targets never turn an absent generator into a resolved part.
 * @evidence contracts/common.md#meaningful-documentation States the order of the two reasons and why.
 * @evidence contracts/modeling.md#part-identity-and-grouping The answer carries the exact part id it refuses.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It reads no spatial value.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Consumers display the answer.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The region resolver owns the source reason.
 * @evidence contracts/anatomy.md#permitted-range An unregistered observation is refused with its cause and the request is left unchanged.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It converts no input.
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
