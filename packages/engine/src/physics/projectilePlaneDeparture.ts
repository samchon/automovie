import type {
  IAutoMovieProjectile,
  IAutoMovieProjectileFirstContact,
  IAutoMovieResolveContactEvents,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { projectileAt } from "./projectileAt";
import { projectileDragDeparture } from "./projectileDragDeparture";

/**
 * Establish departure from one already resolved fixed-plane contact.
 *
 * The opt-in id identifies that initial episode. Without it, or with a
 * rotating tail whose normal extent is not classified, the caller keeps
 * ordinary initial-contact reporting. No signed gap is relaxed.
 *
 * For a point or a fixed-attitude tail, normal clearance differs from the
 * centre's normal position only by a constant. Without drag, constant normal
 * acceleration makes outward motion monotone or gives it one maximum.
 *
 * A positive gap is a physical witness, not a time nudge. With inward gravity
 * the ballistic apex bounds the outward part. Search toward
 * that single maximum until a clear instant is found or adjacent binary64
 * times prevent further refinement; the resolver still owns its unchanged
 * scan and twenty-four TOI bisections after this witness.
 * With drag, the trajectory owner supplies its actual Hermite intervals.
 * Only intervals whose three projected derivative controls are nonnegative
 * may lead to a measured clearance witness. An uncertain interval preserves
 * initial contact; the differential equation alone never certifies departure.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines resolved-contact opt-in, fixed-plane/constant-tail-extent premises, signed normal law, physical clearance witness, conservative unknown result and finite-time termination.
 * @evidence contracts/development/implementation.md#principled-implementation Constant acceleration gives the drag-free normal parabola and its single maximum. The drag branch instead certifies nonnegative derivative controls of the actual dense Hermite position intervals, never inferring dense monotonicity from the continuous force equation.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One eligibility check, one normal-motion classification and a binary search for actual clearance reuse projectileAt and the supplied pair-gap reader.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No epsilon, shifted launch, fabricated clearance, collider blacklist or iteration cap selects an answer. Unsupported attitudes or unresolvable clearance return no certificate; wrong-direction and stationary motion preserve the initial contact.
 * @evidence contracts/development/implementation.md#efficient-algorithms Drag-free non-inward departure is constant work; inward motion refines its apex bracket only until positive clearance or adjacent times. Drag visits actual intervals only until first certified clearance, uncertainty or search end; each reuses the same integrated reader.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the one projectileAt/drag-flight owner and the caller's exact pair-gap reader; it copies no trajectory, collider distance or contact-bisection equations.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources All scalar bounds and state reads are call-local. Only a small time certificate escapes, retaining no projectile, callback or collider; no task or cache is acquired.
 */
export function projectilePlaneDeparture(
  id: string,
  normal: IAutoMovieVector3,
  projectile: IAutoMovieProjectile,
  options: IAutoMovieProjectileFirstContact.IOptions,
  contact: IAutoMovieResolveContactEvents.IInitialContact,
): IAutoMovieResolveContactEvents.Departure | undefined {
  if (options.departing !== id || !(contact.to > contact.from))
    return undefined;
  if (options.tail !== undefined && projectile.attitude?.kind !== "fixed")
    return undefined;
  if (projectile.drag !== undefined && contact.from < 0) return undefined;
  if (!Number.isFinite(contact.gap)) return undefined;
  if (projectile.drag !== undefined)
    return projectileDragDeparture(normal, projectile, contact);

  const speed: number = Vector3.dot(
    projectileAt(projectile, contact.from).velocity,
    normal,
  );
  const acceleration: number = Vector3.dot(projectile.gravity, normal);
  if (!Number.isFinite(speed) || !Number.isFinite(acceleration))
    throw new RangeError(
      "Projectile plane departure needs finite normal motion",
    );
  if (speed < 0 || (speed === 0 && acceleration <= 0)) return undefined;
  if (acceleration >= 0) return { kind: "no-entry" };

  const apex: number = contact.from - speed / acceleration;
  const end: number = Math.min(contact.to, apex);
  if (!(Number.isFinite(end) && end > contact.from)) return undefined;
  const endGap: number = contact.at(end);
  if (Number.isFinite(endGap) && endGap > 0)
    return { kind: "clearance", seconds: end };
  const endSpeed: number = Vector3.dot(
    projectileAt(projectile, end).velocity,
    normal,
  );
  if (!Number.isFinite(endSpeed))
    throw new RangeError(
      "Projectile plane departure needs finite normal motion",
    );
  if (endSpeed >= 0)
    return end === contact.to ? { kind: "no-entry" } : undefined;

  let lo: number = contact.from;
  let hi: number = end;
  for (;;) {
    const seconds: number = lo + (hi - lo) / 2;
    if (!(seconds > lo && seconds < hi)) return undefined;
    const gap: number = contact.at(seconds);
    if (Number.isFinite(gap) && gap > 0) return { kind: "clearance", seconds };
    const velocity: number = Vector3.dot(
      projectileAt(projectile, seconds).velocity,
      normal,
    );
    if (!Number.isFinite(velocity))
      throw new RangeError(
        "Projectile plane departure needs finite normal motion",
      );
    if (velocity > 0) lo = seconds;
    else hi = seconds;
  }
}
