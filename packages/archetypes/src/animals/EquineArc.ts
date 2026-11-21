import { AutoMovieGravity } from "@automovie/engine";

/**
 * The body's vertical offset through a jump: the ballistic flight b(t) = g/2 (t − t_T)(t_L − t) between final hind liftoff t_T and first fore landing t_L, zero outside it.
 *
 * The offset is continuous at both events. Its rate is not: the push-off and the landing impact are not resolved. A rigid upright trunk cannot rise at the flight's takeoff velocity while the hinds are still planted, because a planted hind trailing the hip is already at its reach. Resolving the push-off needs the trunk's takeoff pitch.
 *
 * @param seconds The film second.
 * @param push The second both hinds are down for the push-off; read once the push-off is resolved.
 * @param takeoff The second of final hind liftoff.
 * @param landing The second of first fore landing.
 * @param absorb The second the first fore stance ends; read once the landing is resolved.
 * @returns The body's vertical offset, metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the flight law, its continuity and what is not resolved.
 * @evidence contracts/development/implementation.md#principled-implementation Ballistic flight under standard gravity through the two contact events.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One polynomial.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No constant is fitted. The unresolved rate change is stated rather than hidden.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's gravity.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function EquineArc(
  seconds: number,
  push: number,
  takeoff: number,
  landing: number,
  absorb: number,
): number {
  if (
    !(seconds > takeoff && seconds < landing) ||
    !(push <= takeoff && absorb >= landing)
  )
    return 0;
  return (
    (AutoMovieGravity.STANDARD / 2) * (seconds - takeoff) * (landing - seconds)
  );
}
