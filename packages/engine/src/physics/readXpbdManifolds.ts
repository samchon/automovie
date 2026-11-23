import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import type { AutoMovieXpbdWorld } from "./AutoMovieXpbdWorld";
import type { solveXpbdContacts } from "./solveXpbdContacts";

/**
 * A step's touching pairs that responded, one manifold each: non-sensor
 * pairs with their normal from the first collider toward the second and
 * every patch point's world witness midpoint, its separation where the step
 * found it and the normal impulse the step transferred there: the position
 * passes' multiplier over the substep, `lambda / h`, plus the velocity
 * passes' impulse, which together are the momentum the contact gave each
 * body.
 *
 * @param contacts The step's contacts, the points of one pair adjacent.
 * @param h The substep, seconds.
 * @returns Fresh manifolds, in pair order; their colliders are the contacts'.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States which pairs are reported, the normal's direction, each point's position, separation and impulse with units, and the order.
 * @evidence contracts/development/implementation.md#principled-implementation Each point's impulse is the momentum the step's position and velocity passes transferred, so a reader sees the step's real load; the witness midpoint is the two bodies' contact points at their current poses.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass that opens a manifold whenever the pair index changes.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Sensor pairs are left to the world's intersections; no pair has its own rule.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the step's contacts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Built on demand from the retained contacts; a caller reading twice gets equal fresh records.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh records; retains nothing.
 */
export function readXpbdManifolds(
  contacts: readonly solveXpbdContacts.IContact[],
  h: number,
): AutoMovieXpbdWorld.IManifold[] {
  const result: AutoMovieXpbdWorld.IManifold[] = [];
  for (const contact of contacts) {
    if (contact.a.sensor || contact.b.sensor) continue;
    let manifold: AutoMovieXpbdWorld.IManifold | undefined =
      result[result.length - 1];
    if (manifold === undefined || manifold.pair !== contact.pair) {
      manifold = {
        pair: contact.pair,
        a: contact.a,
        b: contact.b,
        normal: { ...contact.normal },
        friction: contact.friction,
        points: [],
      };
      result.push(manifold);
    }
    manifold.points.push({
      point: Vector3.scale(
        Vector3.add(
          Vector3.add(
            contact.a.body.center,
            Quaternion.rotateVector(contact.a.body.orientation, contact.localA),
          ),
          Vector3.add(
            contact.b.body.center,
            Quaternion.rotateVector(contact.b.body.orientation, contact.localB),
          ),
        ),
        0.5,
      ),
      separation: contact.detected,
      impulse: contact.normalLambda / h + contact.velocityImpulse,
    });
  }
  return result;
}
